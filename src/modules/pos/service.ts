import { MedusaService } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { Cart, CartItem, type PosCart, type PosCartItem } from "./models"

interface PosCustomer {
  id?: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
}

class PosService extends MedusaService({
  Cart,
  CartItem,
}) {
  private logger_: Logger
  private container_: any

  constructor(container: any) {
    super(container)
    this.logger_ = container.logger
    this.container_ = container
  }

  /**
   * Get default region ID using Medusa Region Module
   */
  private async getDefaultRegionId(): Promise<string> {
    try {
      const regionModuleService = this.container_.resolve(Modules.REGION)
      const regions = await regionModuleService.listRegions()
      
      if (regions && regions.length > 0) {
        return regions[0].id
      }
      
      // Default fallback region ID
      return "reg_01K4RDS0MYJ783R1A0SVAY914T"
    } catch (error) {
      this.logger_.warn(`Failed to get regions, using default: ${error}`)
      return "reg_01K4RDS0MYJ783R1A0SVAY914T"
    }
  }

  /**
   * Convert Medusa cart to PosCart interface with proper totals calculation
   */
  private async convertMedusaCartToPosCart(medusaCart: any): Promise<PosCart> {
    const cartModuleService = this.container_.resolve(Modules.CART)
    
    // Get cart with calculated totals
    const cartWithTotals = await cartModuleService.retrieveCart(medusaCart.id, {
      relations: ['items', 'items.variant', 'items.product']
    })

    const items: PosCartItem[] = (cartWithTotals.items || []).map((item: any) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price || 0,
      currency_code: item.currency_code || cartWithTotals.currency_code || 'inr',
      title: item.product?.title || item.title || 'Unknown Product',
      variant_title: item.variant?.title || 'Default Variant',
      sku: item.variant?.sku || undefined
    }))

    // Calculate totals using Medusa's built-in calculation
    const subtotal = cartWithTotals.subtotal || 0
    const taxAmount = cartWithTotals.tax_total || 0
    const discountAmount = cartWithTotals.discount_total || 0
    const total = cartWithTotals.total || 0

    return {
      id: cartWithTotals.id,
      items,
      customer_id: cartWithTotals.customer_id,
      discount_amount: discountAmount,
      subtotal: subtotal,
      tax_amount: taxAmount,
      total: total,
      currency_code: cartWithTotals.currency_code || 'inr',
      created_at: new Date(cartWithTotals.created_at),
      updated_at: new Date(cartWithTotals.updated_at)
    }
  }

  /**
   * Create a new cart using Medusa Cart Module
   */
  async createCart(customerId?: string, sessionId?: string): Promise<PosCart> {
    this.logger_.info('🛒 Creating new POS cart using Cart Module...')
    
    try {
      const regionId = await this.getDefaultRegionId()
      this.logger_.info(`Using region ID: ${regionId}`)
      
      const cartModuleService = this.container_.resolve(Modules.CART)
      const medusaCart = await cartModuleService.createCarts({
        currency_code: "inr",
        region_id: regionId,
        customer_id: customerId,
        email: customerId ? undefined : "pos-customer@example.com"
      })

      this.logger_.info(`✅ Created POS cart: ${medusaCart.id}`)
      return await this.convertMedusaCartToPosCart(medusaCart)
    } catch (error) {
      this.logger_.error('❌ Failed to create POS cart:', error)
      throw new Error(`Failed to create cart: ${error.message}`)
    }
  }

  /**
   * Get a cart by ID using Medusa Cart Module
   */
  async getCart(cartId: string): Promise<PosCart | null> {
    try {
      const cartModuleService = this.container_.resolve(Modules.CART)
      const cart = await cartModuleService.retrieveCart(cartId, {
        relations: ['items', 'items.variant', 'items.product']
      })
      return await this.convertMedusaCartToPosCart(cart)
    } catch (error) {
      this.logger_.error(`Failed to get cart ${cartId}:`, error)
      return null
    }
  }

  /**
   * Add item to cart using Medusa Cart Module
   */
  async addToCart(
    cartId: string, 
    item: Omit<PosCartItem, 'quantity'> & { quantity?: number }
  ): Promise<PosCart> {
    try {
      const quantity = item.quantity || 1
      this.logger_.info(`🛒 Adding item to cart ${cartId}: ${item.title} (x${quantity})`)

      const cartModuleService = this.container_.resolve(Modules.CART)
      
      // Get current cart to check for existing items
      const currentCart = await cartModuleService.retrieveCart(cartId, {
        relations: ['items']
      })

      // Check if this variant already exists in the cart
      const existingItem = currentCart.items?.find(cartItem => cartItem.variant_id === item.variant_id)
      
      if (existingItem) {
        // Update existing item quantity
        await cartModuleService.updateLineItems(existingItem.id, {
          quantity: existingItem.quantity + quantity
        })
      } else {
        // Add new line item to cart
        await cartModuleService.addLineItems({
          cart_id: cartId,
          title: item.title || 'Product',
          quantity: quantity,
          unit_price: item.unit_price || 0,
          variant_id: item.variant_id,
          product_id: item.product_id
        })
      }

      // Get updated cart with totals
      const updatedCart = await cartModuleService.retrieveCart(cartId, {
        relations: ['items', 'items.variant', 'items.product']
      })

      this.logger_.info(`✅ Added item to cart ${cartId}: ${item.title}`)
      return await this.convertMedusaCartToPosCart(updatedCart)
    } catch (error) {
      this.logger_.error(`❌ Failed to add item to cart ${cartId}:`, error)
      throw new Error(`Failed to add item: ${error.message}`)
    }
  }

  /**
   * Update item quantity in cart using Medusa Cart Module
   */
  async updateCartItemQuantity(
    cartId: string, 
    variantId: string, 
    quantity: number
  ): Promise<PosCart> {
    try {
      this.logger_.info(`🛒 Updating cart ${cartId} item ${variantId} quantity to ${quantity}`)

      const cartModuleService = this.container_.resolve(Modules.CART)
      
      // Get current cart to find the line item
      const currentCart = await cartModuleService.retrieveCart(cartId, {
        relations: ['items']
      })

      const lineItem = currentCart.items?.find(item => item.variant_id === variantId)
      if (!lineItem) {
        throw new Error(`Line item with variant ${variantId} not found in cart`)
      }

      // Update line item quantity
      await cartModuleService.updateLineItems(lineItem.id, {
        quantity: quantity
      })

      // Get updated cart
      const updatedCart = await cartModuleService.retrieveCart(cartId, {
        relations: ['items', 'items.variant', 'items.product']
      })

      this.logger_.info(`✅ Updated item quantity in cart ${cartId}`)
      return await this.convertMedusaCartToPosCart(updatedCart)
    } catch (error) {
      this.logger_.error(`❌ Failed to update item quantity in cart ${cartId}:`, error)
      throw new Error(`Failed to update quantity: ${error.message}`)
    }
  }

  /**
   * Remove item from cart using Medusa Cart Module
   */
  async removeFromCart(cartId: string, variantId: string): Promise<PosCart> {
    try {
      this.logger_.info(`🛒 Removing item ${variantId} from cart ${cartId}`)

      const cartModuleService = this.container_.resolve(Modules.CART)
      
      // Get current cart to find the line item
      const currentCart = await cartModuleService.retrieveCart(cartId, {
        relations: ['items']
      })

      const lineItem = currentCart.items?.find(item => item.variant_id === variantId)
      if (!lineItem) {
        throw new Error(`Line item with variant ${variantId} not found in cart`)
      }

      // Remove line item from cart
      await cartModuleService.deleteLineItems([lineItem.id])

      // Get updated cart
      const updatedCart = await cartModuleService.retrieveCart(cartId, {
        relations: ['items', 'items.variant', 'items.product']
      })

      this.logger_.info(`✅ Removed item from cart ${cartId}`)
      return await this.convertMedusaCartToPosCart(updatedCart)
    } catch (error) {
      this.logger_.error(`❌ Failed to remove item from cart ${cartId}:`, error)
      throw new Error(`Failed to remove item: ${error.message}`)
    }
  }

  /**
   * Set customer for cart using Medusa Cart Module
   */
  async setCartCustomer(cartId: string, customer: PosCustomer): Promise<PosCart> {
    try {
      this.logger_.info(`🛒 Setting customer for cart ${cartId}`)

      const cartModuleService = this.container_.resolve(Modules.CART)
      await cartModuleService.updateCarts(cartId, {
        customer_id: customer.id,
        email: customer.email
      })

      const updatedCart = await cartModuleService.retrieveCart(cartId, {
        relations: ['items', 'items.variant', 'items.product']
      })

      this.logger_.info(`✅ Set customer for cart ${cartId}`)
      return await this.convertMedusaCartToPosCart(updatedCart)
    } catch (error) {
      this.logger_.error(`❌ Failed to set customer for cart ${cartId}:`, error)
      throw new Error(`Failed to set customer: ${error.message}`)
    }
  }

  /**
   * Apply discount to cart using Medusa Promotion Module
   */
  async applyDiscount(cartId: string, discountCode: string): Promise<PosCart> {
    try {
      this.logger_.info(`🛒 Applying discount ${discountCode} to cart ${cartId}`)

      const promotionModuleService = this.container_.resolve(Modules.PROMOTION)
      const cartModuleService = this.container_.resolve(Modules.CART)

      // Validate discount code
      const promotions = await promotionModuleService.listPromotions({
        code: discountCode,
        is_automatic: false
      })

      if (!promotions || promotions.length === 0) {
        throw new Error('Invalid discount code')
      }

      const promotion = promotions[0]

      // Check if promotion is active
      const now = new Date()
      if (promotion.campaign?.ends_at && new Date(promotion.campaign.ends_at) < now) {
        throw new Error('This discount code has expired')
      }

      if (promotion.campaign?.starts_at && new Date(promotion.campaign.starts_at) > now) {
        throw new Error('This discount code is not yet active')
      }

      // Apply promotion to cart
      await promotionModuleService.addPromotionsToCart(cartId, [promotion.id])

      const updatedCart = await cartModuleService.retrieveCart(cartId, {
        relations: ['items', 'items.variant', 'items.product']
      })

      this.logger_.info(`✅ Applied discount to cart ${cartId}`)
      return await this.convertMedusaCartToPosCart(updatedCart)
    } catch (error) {
      this.logger_.error(`❌ Failed to apply discount to cart ${cartId}:`, error)
      throw new Error(`Failed to apply discount: ${error.message}`)
    }
  }

  /**
   * Remove discount from cart using Medusa Promotion Module
   */
  async removeDiscount(cartId: string): Promise<PosCart> {
    try {
      this.logger_.info(`🛒 Removing discount from cart ${cartId}`)

      const promotionModuleService = this.container_.resolve(Modules.PROMOTION)
      const cartModuleService = this.container_.resolve(Modules.CART)

      // Remove all promotions from cart
      await promotionModuleService.removePromotionsFromCart(cartId)

      const updatedCart = await cartModuleService.retrieveCart(cartId, {
        relations: ['items', 'items.variant', 'items.product']
      })

      this.logger_.info(`✅ Removed discount from cart ${cartId}`)
      return await this.convertMedusaCartToPosCart(updatedCart)
    } catch (error) {
      this.logger_.error(`❌ Failed to remove discount from cart ${cartId}:`, error)
      throw new Error(`Failed to remove discount: ${error.message}`)
    }
  }

  /**
   * Complete the order and create a new cart immediately using Medusa modules
   */
  async completeOrder(
    cartId: string, 
    paymentMethod: string = 'cash'
  ): Promise<{ order_id: string; cart: PosCart }> {
    try {
      this.logger_.info(`🛒 Starting order completion for cart: ${cartId}`)

      const cartModuleService = this.container_.resolve(Modules.CART)
      const orderModuleService = this.container_.resolve(Modules.ORDER)

      // Get current cart
      const currentCart = await cartModuleService.retrieveCart(cartId, {
        relations: ['items']
      })

      if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
        throw new Error('Cannot complete empty cart')
      }

      // Create order from cart
      const orderInput = {
        currency_code: currentCart.currency_code,
        email: currentCart.email || 'pos-customer@example.com',
        region_id: currentCart.region_id,
        customer_id: currentCart.customer_id,
        status: 'completed',
        items: currentCart.items.map((item: any) => ({
          title: item.title,
          variant_id: item.variant_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      }

      const order = await orderModuleService.createOrders(orderInput)

      // Mark cart as completed
      await cartModuleService.updateCarts(cartId, {
        completed_at: new Date().toISOString()
      })

      // Create new cart for next transaction
      const newCart = await cartModuleService.createCarts({
        currency_code: currentCart.currency_code || "inr",
        region_id: currentCart.region_id,
        email: "pos-customer@example.com"
      })

      this.logger_.info(`✅ Successfully completed order: ${order.id}`)
      this.logger_.info(`✅ Created new cart for next transaction: ${newCart.id}`)

      return {
        order_id: order.id,
        cart: await this.convertMedusaCartToPosCart(newCart)
      }
    } catch (error) {
      this.logger_.error('❌ Failed to complete order:', error)
      throw new Error(`Failed to complete order: ${error.message}`)
    }
  }

  /**
   * Clear cart (not applicable with Medusa - carts are completed)
   */
  async clearCart(cartId: string): Promise<void> {
    this.logger_.info(`Cart ${cartId} completed/cleared`)
  }

  /**
   * Get all active carts (placeholder)
   */
  async getActiveCarts(): Promise<PosCart[]> {
    return []
  }

  // Additional methods required by workflows
  async createOrUpdateCartItem(data: any): Promise<PosCartItem> {
    // Implementation for creating or updating cart items
    return await this.createCartItems(data)
  }

  async updateCartItemByMedusaId(medusaLineItemId: string, data: any): Promise<PosCartItem> {
    // Implementation for updating cart item by Medusa line item ID
    const cartItems = await this.listCartItems({ medusa_line_item_id: medusaLineItemId })
    if (cartItems.length > 0) {
      return await this.updateCartItems({ id: cartItems[0].id }, data)
    }
    throw new Error(`Cart item with Medusa line item ID ${medusaLineItemId} not found`)
  }

  async deleteCartItemByMedusaId(medusaLineItemId: string): Promise<void> {
    // Implementation for deleting cart item by Medusa line item ID
    const cartItems = await this.listCartItems({ medusa_line_item_id: medusaLineItemId })
    if (cartItems.length > 0) {
      await this.deleteCartItems([cartItems[0].id])
    }
  }
}

export default PosService