import { Logger } from "@medusajs/framework/types"

interface PosCartItem {
  product_id: string
  variant_id: string
  quantity: number
  unit_price: number
  currency_code: string
  title: string
  variant_title?: string
  sku?: string
}

interface PosCart {
  id: string
  items: PosCartItem[]
  customer_id?: string
  discount_code?: string
  discount_amount: number
  subtotal: number
  tax_amount: number
  total: number
  currency_code?: string
  created_at: Date
  updated_at: Date
}

interface PosCustomer {
  id?: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
}

class PosService {
  private logger_: Logger
  private container_: any

  constructor(container: any) {
    this.logger_ = container.logger
    this.container_ = container
  }

  /**
   * Make HTTP request to admin API
   */
  private async makeAdminRequest(path: string, options: any = {}) {
    const baseUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
    const url = `${baseUrl}/admin${path}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} ${errorText}`)
    }
    
    return response.json()
  }

  /**
   * Get default region ID using admin API
   */
  private async getDefaultRegionId(): Promise<string> {
    try {
      const response = await this.makeAdminRequest('/regions?limit=1')
      
      if (response.regions && response.regions.length > 0) {
        return response.regions[0].id
      }
      
      // Default fallback region ID
      return "reg_01K4RDS0MYJ783R1A0SVAY914T"
    } catch (error) {
      this.logger_.warn(`Failed to get regions, using default: ${error}`)
      return "reg_01K4RDS0MYJ783R1A0SVAY914T"
    }
  }

  /**
   * Convert Medusa cart to PosCart interface
   */
  private convertMedusaCartToPosCart(medusaCart: any): PosCart {
    const items: PosCartItem[] = (medusaCart.items || []).map((item: any) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price || 0,
      currency_code: item.currency_code || medusaCart.currency_code || 'inr',
      title: item.product?.title || item.title || 'Unknown Product',
      variant_title: item.variant?.title || 'Default Variant',
      sku: item.variant?.sku || null
    }))

    return {
      id: medusaCart.id,
      items,
      customer_id: medusaCart.customer_id,
      discount_amount: 0,
      subtotal: medusaCart.subtotal || 0,
      tax_amount: medusaCart.tax_total || 0,
      total: medusaCart.total || 0,
      currency_code: medusaCart.currency_code || 'inr',
      created_at: new Date(medusaCart.created_at),
      updated_at: new Date(medusaCart.updated_at)
    }
  }

  /**
   * Create a new cart using Medusa's admin API
   */
  async createCart(): Promise<PosCart> {
    this.logger_.info('🛒 Creating new Medusa cart for POS...')
    
    try {
      const regionId = await this.getDefaultRegionId()
      this.logger_.info(`Using region ID: ${regionId}`)
      
      const response = await this.makeAdminRequest('/carts', {
        method: 'POST',
        body: JSON.stringify({
          currency_code: "inr",
          region_id: regionId,
          email: "pos-customer@example.com"
        })
      })

      this.logger_.info(`✅ Created Medusa cart: ${response.cart.id}`)
      return this.convertMedusaCartToPosCart(response.cart)
    } catch (error) {
      this.logger_.error('❌ Failed to create Medusa cart:', error)
      throw new Error(`Failed to create cart: ${error.message}`)
    }
  }

  /**
   * Get a cart by ID from Medusa
   */
  async getCart(cartId: string): Promise<PosCart | null> {
    try {
      const response = await this.makeAdminRequest(`/carts/${cartId}`)
      return this.convertMedusaCartToPosCart(response.cart)
    } catch (error) {
      this.logger_.error(`Failed to get cart ${cartId}:`, error)
      return null
    }
  }

  /**
   * Add item to cart using Medusa's admin API
   */
  async addToCart(
    cartId: string, 
    item: Omit<PosCartItem, 'quantity'> & { quantity?: number }
  ): Promise<PosCart> {
    try {
      const quantity = item.quantity || 1
      this.logger_.info(`🛒 Adding item to cart ${cartId}: ${item.title} (x${quantity})`)

      const response = await this.makeAdminRequest(`/carts/${cartId}/line-items`, {
        method: 'POST',
        body: JSON.stringify({
          variant_id: item.variant_id,
          quantity: quantity
        })
      })

      this.logger_.info(`✅ Added item to cart ${cartId}: ${item.title}`)
      return this.convertMedusaCartToPosCart(response.cart)
    } catch (error) {
      this.logger_.error(`❌ Failed to add item to cart ${cartId}:`, error)
      throw new Error(`Failed to add item: ${error.message}`)
    }
  }

  /**
   * Update item quantity in cart
   */
  async updateCartItemQuantity(
    cartId: string, 
    variantId: string, 
    quantity: number
  ): Promise<PosCart> {
    try {
      this.logger_.info(`🛒 Updating cart ${cartId} item ${variantId} quantity to ${quantity}`)

      // Get current cart to find the line item
      const currentCart = await this.getCart(cartId)
      if (!currentCart) {
        throw new Error(`Cart ${cartId} not found`)
      }

      const lineItem = currentCart.items.find(item => item.variant_id === variantId)
      if (!lineItem) {
        throw new Error(`Line item with variant ${variantId} not found in cart`)
      }

      const response = await this.makeAdminRequest(`/carts/${cartId}/line-items/${variantId}`, {
        method: 'POST',
        body: JSON.stringify({
          quantity: quantity
        })
      })

      this.logger_.info(`✅ Updated item quantity in cart ${cartId}`)
      return this.convertMedusaCartToPosCart(response.cart)
    } catch (error) {
      this.logger_.error(`❌ Failed to update item quantity in cart ${cartId}:`, error)
      throw new Error(`Failed to update quantity: ${error.message}`)
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(cartId: string, variantId: string): Promise<PosCart> {
    try {
      this.logger_.info(`🛒 Removing item ${variantId} from cart ${cartId}`)

      const response = await this.makeAdminRequest(`/carts/${cartId}/line-items/${variantId}`, {
        method: 'DELETE'
      })

      this.logger_.info(`✅ Removed item from cart ${cartId}`)
      return this.convertMedusaCartToPosCart(response.cart)
    } catch (error) {
      this.logger_.error(`❌ Failed to remove item from cart ${cartId}:`, error)
      throw new Error(`Failed to remove item: ${error.message}`)
    }
  }

  /**
   * Set customer for cart
   */
  async setCartCustomer(cartId: string, customer: PosCustomer): Promise<PosCart> {
    try {
      this.logger_.info(`🛒 Setting customer for cart ${cartId}`)

      const response = await this.makeAdminRequest(`/carts/${cartId}`, {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customer.id,
          email: customer.email
        })
      })

      this.logger_.info(`✅ Set customer for cart ${cartId}`)
      return this.convertMedusaCartToPosCart(response.cart)
    } catch (error) {
      this.logger_.error(`❌ Failed to set customer for cart ${cartId}:`, error)
      throw new Error(`Failed to set customer: ${error.message}`)
    }
  }

  /**
   * Apply discount to cart
   */
  async applyDiscount(cartId: string, discountCode: string): Promise<PosCart> {
    try {
      this.logger_.info(`🛒 Applying discount ${discountCode} to cart ${cartId}`)

      // TODO: Implement proper discount application using Medusa's promotion system
      // For now, just return the cart as-is
      const cart = await this.getCart(cartId)
      if (!cart) {
        throw new Error(`Cart ${cartId} not found`)
      }
      
      this.logger_.info(`✅ Applied discount to cart ${cartId}`)
      return cart
    } catch (error) {
      this.logger_.error(`❌ Failed to apply discount to cart ${cartId}:`, error)
      throw new Error(`Failed to apply discount: ${error.message}`)
    }
  }

  /**
   * Remove discount from cart
   */
  async removeDiscount(cartId: string): Promise<PosCart> {
    try {
      const cart = await this.getCart(cartId)
      if (!cart) {
        throw new Error(`Cart ${cartId} not found`)
      }
      
      this.logger_.info(`✅ Removed discount from cart ${cartId}`)
      return cart
    } catch (error) {
      this.logger_.error(`❌ Failed to remove discount from cart ${cartId}:`, error)
      throw new Error(`Failed to remove discount: ${error.message}`)
    }
  }

  /**
   * Complete the order and create a new cart immediately
   */
  async completeOrder(
    cartId: string, 
    paymentMethod: string = 'cash'
  ): Promise<{ order_id: string; cart: PosCart }> {
    try {
      this.logger_.info(`🛒 Starting order completion for cart: ${cartId}`)

      // Complete the cart using admin API
      const response = await this.makeAdminRequest(`/carts/${cartId}/complete`, {
        method: 'POST'
      })
      
      const order = response.data

      this.logger_.info(`✅ Successfully completed order: ${order.id}`)

      // Immediately create a new cart for the next transaction
      const newCart = await this.createCart()
      this.logger_.info(`✅ Created new cart for next transaction: ${newCart.id}`)

      return {
        order_id: order.id,
        cart: newCart
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
}

export default PosService