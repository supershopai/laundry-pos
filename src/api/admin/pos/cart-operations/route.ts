import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Helper function to calculate cart totals
function calculateCartTotals(cart: any) {
  console.log('🧮 Calculating cart totals for cart:', cart.id)
  console.log('📦 Cart items:', cart.items?.map((item: any) => ({
    id: item.id,
    title: item.title,
    unit_price: item.unit_price,
    quantity: item.quantity,
    adjustments: item.adjustments
  })))
  
  if (cart.items && cart.items.length > 0) {
    const calculatedSubtotal = cart.items.reduce((sum: number, item: any) => {
      return sum + (item.unit_price * item.quantity)
    }, 0)

    cart.subtotal = calculatedSubtotal
    console.log('💰 Calculated subtotal:', calculatedSubtotal)

    // Calculate discount total from adjustments
    const discountTotal = cart.items.reduce((sum: number, item: any) => {
      const itemDiscount = item.adjustments?.reduce((adjSum: number, adj: any) => {
        let amount = adj.amount || 0
        // Handle BigNumber amounts
        if (amount && typeof amount === 'object' && amount.numeric_) {
          amount = amount.numeric_
        } else if (amount && typeof amount === 'object' && amount.toNumber) {
          amount = amount.toNumber()
        }
        console.log('🔍 Adjustment amount:', { original: adj.amount, processed: amount })
        return adjSum + amount
      }, 0) || 0
      console.log('📊 Item discount total:', itemDiscount)
      return sum + itemDiscount
    }, 0)

    console.log('💰 Total discount calculated:', discountTotal)
    cart.discount_total = Math.abs(discountTotal) // Make positive
    cart.tax_total = 0 // No tax for now
    cart.total = calculatedSubtotal - Math.abs(discountTotal)

    // Ensure total is not negative
    if (cart.total < 0) {
      cart.total = 0
    }
    
    console.log('📊 Final calculated totals:', {
      subtotal: cart.subtotal,
      discount_total: cart.discount_total,
      tax_total: cart.tax_total,
      total: cart.total
    })
  } else {
    cart.subtotal = 0
    cart.discount_total = 0
    cart.tax_total = 0
    cart.total = 0
  }
  return cart
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('=== POS Cart Operation ===')
    console.log('User in request:', (req as any).user ? `${(req as any).user.id}` : 'None')
    
    const body = req.body as any
    const { operation, cart_id, ...data } = body
    console.log('Operation:', operation)
    console.log('Cart ID:', cart_id)
    console.log('Data:', data)

    // Get Cart Module Service
    const cartModuleService = req.scope.resolve(Modules.CART)

    switch (operation) {
      case 'create_cart':
        console.log('🛒 Backend: Creating new cart using Cart Module...')
        
        try {
          // Get default region ID
          const regionModuleService = req.scope.resolve(Modules.REGION)
          const regions = await regionModuleService.listRegions()
          const regionId = regions && regions.length > 0 ? regions[0].id : "reg_01K4RDS0MYJ783R1A0SVAY914T"
          
          const cart = await cartModuleService.createCarts({
            currency_code: "inr",
            region_id: regionId,
            email: "pos-customer@example.com"
          })
          
          console.log('✅ Backend: Cart created successfully:', cart.id)
          return res.json({ cart })
        } catch (error) {
          console.error('❌ Backend: Cart creation failed:', error)
          return res.status(400).json({ error: error.message })
        }

      case 'add_item':
        console.log('🛒 Processing add_item operation with Cart Module')
        const { variant_id, quantity, unit_price, title, product_id, variant_title, sku } = data
        console.log('Item details:', { variant_id, quantity, unit_price, title, product_id })
        
        try {
          const lineItem = await cartModuleService.addLineItems({
            cart_id: cart_id,
            title: title || 'Product',
            quantity: quantity || 1,
            unit_price: unit_price || 0,
            variant_id: variant_id
          })
          
          // Get updated cart with items and adjustments
          const updatedCart = await cartModuleService.retrieveCart(cart_id, {
            relations: ['items', 'items.adjustments']
          })
          
          // Calculate totals
          calculateCartTotals(updatedCart)
          
          console.log('✅ Item processed successfully')
          return res.json({ cart: updatedCart })
        } catch (error) {
          console.error('❌ Add item failed:', error)
          return res.status(400).json({ error: error.message })
        }

      case 'update_quantity':
        const { variant_id: updateVariantId, quantity: newQuantity } = data
        
        try {
          await cartModuleService.updateLineItems([{
            id: updateVariantId,
            quantity: newQuantity
          }])
          
          // Get updated cart with items and adjustments
          const cartAfterUpdate = await cartModuleService.retrieveCart(cart_id, {
            relations: ['items', 'items.adjustments']
          })
          
          // Calculate totals
          calculateCartTotals(cartAfterUpdate)
          
          return res.json({ cart: cartAfterUpdate })
        } catch (error) {
          console.error('❌ Update quantity failed:', error)
          return res.status(400).json({ error: error.message })
        }

      case 'remove_item':
        const { variant_id: removeVariantId } = data
        
        try {
          await cartModuleService.updateLineItems([{
            id: removeVariantId,
            quantity: 0
          }])
          
          // Get updated cart with items and adjustments
          const cartAfterRemoval = await cartModuleService.retrieveCart(cart_id, {
            relations: ['items', 'items.adjustments']
          })
          
          // Calculate totals
          calculateCartTotals(cartAfterRemoval)
          
          return res.json({ cart: cartAfterRemoval })
        } catch (error) {
          console.error('❌ Remove item failed:', error)
          return res.status(400).json({ error: error.message })
        }

      case 'set_customer':
        const { customer_id } = data
        
        try {
          await cartModuleService.updateCarts(cart_id, {
            customer_id: customer_id
          })
          
          // Get updated cart with items and adjustments
          const cartWithCustomer = await cartModuleService.retrieveCart(cart_id, {
            relations: ['items', 'items.adjustments']
          })
          
          // Calculate totals
          calculateCartTotals(cartWithCustomer)
          
          return res.json({ cart: cartWithCustomer })
        } catch (error) {
          console.error('❌ Set customer failed:', error)
          return res.status(400).json({ error: error.message })
        }

      case 'apply_discount':
        console.log('🎫 Processing apply_discount operation with Medusa Promotion Module')
        const { discount_code } = data
        console.log('Discount code to apply:', discount_code)
        
        try {
          // Get Promotion Module Service
          const promotionModuleService = req.scope.resolve(Modules.PROMOTION)
          
          // Find promotion by code
          const promotions = await promotionModuleService.listPromotions({
            code: discount_code,
            status: ['active']
          })
          
          if (!promotions || promotions.length === 0) {
            return res.status(400).json({ 
              error: 'Promotion not found',
              success: false,
              message: 'Invalid or inactive promotion code'
            })
          }
          
          const promotion = promotions[0]
          console.log('✅ Promotion found:', promotion.id)
          
          // Get current cart with relations
          const currentCart = await cartModuleService.retrieveCart(cart_id, {
            relations: ['items', 'items.adjustments']
          })
          
          // Prepare cart data for computeActions
          const cartData = {
            items: (currentCart.items || []).map((item: any) => ({
              id: item.id,
              title: item.title,
              unit_price: item.unit_price,
              quantity: item.quantity,
              variant_id: item.variant_id,
              product_id: item.product_id,
              adjustments: item.adjustments || [],
              subtotal: item.subtotal || (item.unit_price * item.quantity),
              total: item.total || (item.unit_price * item.quantity),
              original_total: item.unit_price * item.quantity,
              is_discountable: true
            })),
            shipping_methods: (currentCart.shipping_methods || []).map((method: any) => ({
              id: method.id,
              amount: method.amount,
              subtotal: method.amount,
              original_total: method.amount,
              adjustments: (method.adjustments || []).map((adj: any) => ({
                id: adj.id,
                amount: adj.amount,
                code: adj.code || '',
                is_tax_inclusive: adj.is_tax_inclusive || false
              }))
            })),
            subtotal: currentCart.subtotal || 0,
            total: currentCart.total || 0,
            currency_code: currentCart.currency_code || 'inr',
            region_id: currentCart.region_id,
            customer_id: currentCart.customer_id
          }
          
          console.log('📦 Cart data for computeActions:', JSON.stringify(cartData, null, 2))
          
          // Use Medusa's computeActions method
          const actions = await promotionModuleService.computeActions([promotion.code!], cartData)
          console.log('🎯 Computed actions:', actions)
          
          if (!actions || actions.length === 0) {
            return res.status(400).json({ 
              error: 'Promotion not applicable',
              success: false,
              message: 'This promotion cannot be applied to this cart'
            })
          }
          
          // Execute the computed actions
          for (const action of actions) {
            if (action.action === 'addItemAdjustment') {
              await cartModuleService.addLineItemAdjustments([{
                item_id: action.item_id,
                amount: action.amount,
                code: action.code,
                is_tax_inclusive: action.is_tax_inclusive || false
              }])
              console.log('✅ Item adjustment added:', action.item_id)
            }
          }
          
          // Get updated cart with totals
          const updatedCart = await cartModuleService.retrieveCart(cart_id, {
            relations: ['items', 'items.adjustments']
          })
          
          // Calculate totals
          calculateCartTotals(updatedCart)
          
          console.log('✅ Promotion applied successfully')
          console.log('📊 Final cart totals:', {
            subtotal: updatedCart.subtotal,
            discount_total: updatedCart.discount_total,
            total: updatedCart.total
          })
          
          return res.json({ 
            cart: updatedCart,
            success: true,
            message: 'Promotion applied successfully!'
          })
          
        } catch (error) {
          console.error('❌ Promotion application failed:', error)
          return res.status(400).json({ 
            error: 'Promotion application failed',
            success: false,
            message: error.message || 'There was an error processing your discount code. Please try again.'
          })
        }

      case 'remove_discount':
        console.log('🎫 Processing remove_discount operation with Medusa Promotion Module')
        
        try {
          // Get current cart with relations
          const currentCart = await cartModuleService.retrieveCart(cart_id, {
            relations: ['items', 'items.adjustments']
          })
          
          // Remove all line item adjustments
          if (currentCart.items && currentCart.items.length > 0) {
            for (const item of currentCart.items) {
              if (item.adjustments && item.adjustments.length > 0) {
                // Remove all adjustments for this item
                await cartModuleService.setLineItemAdjustments(item.id, [])
                console.log('✅ Removed adjustments for item:', item.id)
              }
            }
          }
          
          // Get updated cart with totals
          const updatedCart = await cartModuleService.retrieveCart(cart_id, {
            relations: ['items', 'items.adjustments']
          })
          
          // Calculate totals
          calculateCartTotals(updatedCart)
          
          console.log('✅ Discount removed successfully')
          console.log('📊 Final cart totals:', {
            subtotal: updatedCart.subtotal,
            discount_total: updatedCart.discount_total,
            total: updatedCart.total
          })
          
          return res.json({
            cart: updatedCart,
            success: true,
            message: 'Discount removed successfully!'
          })
          
        } catch (error) {
          console.error('❌ Remove discount failed:', error)
          return res.status(400).json({ 
            error: 'Remove discount failed',
            success: false,
            message: error.message || 'There was an error removing the discount. Please try again.'
          })
        }

      case 'fix_promotion':
        console.log('🔧 Processing fix_promotion operation')
        const { promotion_id, application_method } = data
        
        try {
          // This operation is no longer supported - use official Medusa promotion management
          return res.status(400).json({
            error: 'Operation not supported',
            success: false,
            message: 'Please use the official Medusa admin to manage promotions.'
          })
        } catch (error) {
          console.error('Fix promotion error:', error)
          return res.status(400).json({ 
            error: 'Failed to fix promotion',
            success: false,
            message: error.message || 'There was an error fixing the promotion. Please try again.'
          })
        }

      case 'complete_order':
        console.log('🛒 Processing complete_order operation with Cart Module')
        const { payment_method } = data
        
        try {
          // Get current cart with calculated totals using Query service
          const queryModule = req.scope.resolve('query') as any
          const { data: carts } = await queryModule.graph({
            entity: 'cart',
            fields: [
              'id',
              'currency_code',
              'email',
              'customer_id',
              'region_id',
              'total',
              'subtotal',
              'tax_total',
              'discount_total',
              'discount_subtotal',
              'discount_tax_total',
              'original_total',
              'original_tax_total',
              'item_total',
              'item_subtotal',
              'item_tax_total',
              'original_item_total',
              'original_item_subtotal',
              'original_item_tax_total',
              'shipping_total',
              'shipping_subtotal',
              'shipping_tax_total',
              'original_shipping_tax_total',
              'original_shipping_subtotal',
              'original_shipping_total',
              'credit_line_subtotal',
              'credit_line_tax_total',
              'credit_line_total',
              'items.*',
              'items.adjustments.*',
              'shipping_methods.*',
              'customer.*',
              'region.*'
            ],
            filters: {
              id: cart_id
            }
          })
          
          const currentCart = carts?.[0]
          if (!currentCart) {
            throw new Error('Cart not found')
          }
          
          // Convert BigNumber values to numbers for easier handling
          const cartTotals = {
            subtotal: currentCart.subtotal?.toNumber?.() || 0,
            discount_total: currentCart.discount_total?.toNumber?.() || 0,
            tax_total: currentCart.tax_total?.toNumber?.() || 0,
            total: currentCart.total?.toNumber?.() || 0,
            items_count: currentCart.items?.length || 0
          }
          
          console.log('📊 Cart retrieved with calculated totals via Query:', cartTotals)
          
          // If Query service returns 0 totals, fall back to manual calculation
          if (cartTotals.total === 0 && currentCart.items && currentCart.items.length > 0) {
            console.log('⚠️ Query service returned 0 totals, falling back to manual calculation')
            calculateCartTotals(currentCart)
            cartTotals.subtotal = currentCart.subtotal || 0
            cartTotals.discount_total = currentCart.discount_total || 0
            cartTotals.tax_total = currentCart.tax_total || 0
            cartTotals.total = currentCart.total || 0
            console.log('📊 Manual calculation results:', cartTotals)
          }
          
          // Create order using Order Module
          const orderModuleService = req.scope.resolve(Modules.ORDER)
          
          console.log('📊 Order creation - Cart totals from Query:', {
            subtotal: cartTotals.subtotal,
            discount_total: cartTotals.discount_total,
            total: cartTotals.total,
            items_count: cartTotals.items_count,
            customer_email: currentCart.customer?.email || currentCart.email
          })

          // Create order with line items from cart including adjustments
          const orderData = {
            currency_code: currentCart.currency_code,
            email: currentCart.customer?.email || currentCart.email,
            region_id: currentCart.region_id,
            customer_id: currentCart.customer_id,
            status: 'completed',
            items: currentCart.items?.map((item: any) => ({
              title: item.title,
              variant_id: item.variant_id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price?.toNumber?.() || item.unit_price,
              // Include adjustments for discounts
              adjustments: item.adjustments?.map((adj: any) => ({
                amount: adj.amount?.toNumber?.() || adj.amount,
                code: adj.code,
                is_tax_inclusive: adj.is_tax_inclusive || false
              })) || []
            })) || []
          }
          
          console.log('📋 Order data:', JSON.stringify(orderData, null, 2))
          const order = await orderModuleService.createOrders(orderData)
          
          console.log('✅ Order created with line items:', orderData.items.length)
          console.log('🎫 Order line items with adjustments:', orderData.items.map(item => ({
            title: item.title,
            adjustments: item.adjustments
          })))
          
          // Calculate discount total from item adjustments for logging
          const orderDiscountTotal = orderData.items.reduce((total, item) => {
            const itemDiscount = item.adjustments?.reduce((sum, adj) => {
              let amount = adj.amount || 0
              if (amount && typeof amount === 'object' && amount.toNumber) {
                amount = amount.toNumber()
              }
              return sum + amount
            }, 0) || 0
            return total + itemDiscount
          }, 0)
          
          console.log('💰 Calculated order discount total from adjustments:', orderDiscountTotal)
          console.log('📊 Order created with adjustments - discount will be calculated in thermal printer')
          
          // Try to link the order to the cart using Medusa's Link service
          try {
            // Try different Link module resolution approaches
            let linkModule
            try {
              linkModule = req.scope.resolve(Modules.LINK) as any
            } catch {
              try {
                linkModule = req.scope.resolve('linkModule') as any
              } catch {
                try {
                  linkModule = req.scope.resolve('link_modules') as any
                } catch {
                  linkModule = req.scope.resolve('link') as any
                }
              }
            }
            
            if (linkModule && typeof linkModule.create === 'function') {
              // Use the official Link service to create cart-order relationship
              await linkModule.create({
                [Modules.CART]: {
                  cart_id: cart_id,
                },
                [Modules.ORDER]: {
                  order_id: order.id,
                },
              })
              console.log('🔗 Order linked to cart successfully')
            } else {
              console.log('⚠️ Link service not available, order created without linking')
            }
          } catch (linkError) {
            console.log('⚠️ Could not link order to cart (order still created):', linkError.message)
            // Order is still created, just not linked
          }
          
          console.log('✅ Order created successfully:', order.id)
          
          // Get the completed order with calculated totals using Query service
          const { data: orders } = await queryModule.graph({
            entity: 'order',
            fields: [
              'id',
              'currency_code',
              'email',
              'customer_id',
              'status',
              'total',
              'subtotal',
              'tax_total',
              'discount_total',
              'discount_subtotal',
              'discount_tax_total',
              'original_total',
              'original_tax_total',
              'item_total',
              'item_subtotal',
              'item_tax_total',
              'original_item_total',
              'original_item_subtotal',
              'original_item_tax_total',
              'shipping_total',
              'shipping_subtotal',
              'shipping_tax_total',
              'original_shipping_tax_total',
              'original_shipping_subtotal',
              'original_shipping_total',
              'items.*',
              'shipping_methods.*',
              'customer.*',
              'region.*'
            ],
            filters: {
              id: order.id
            }
          })
          
          const completedOrder = orders?.[0] || order
          
          // Convert BigNumber values to numbers for order totals
          const orderTotals = {
            subtotal: completedOrder.subtotal?.toNumber?.() || 0,
            discount_total: completedOrder.discount_total?.toNumber?.() || 0,
            tax_total: completedOrder.tax_total?.toNumber?.() || 0,
            total: completedOrder.total?.toNumber?.() || 0,
            items_count: completedOrder.items?.length || 0
          }
          
          console.log('📊 Order retrieved with calculated totals via Query:', orderTotals)
          
          // If Query service returns 0 totals for order, use cart totals
          if (orderTotals.total === 0 && cartTotals.total > 0) {
            console.log('⚠️ Order Query returned 0 totals, using cart totals')
            orderTotals.subtotal = cartTotals.subtotal
            orderTotals.discount_total = cartTotals.discount_total
            orderTotals.tax_total = cartTotals.tax_total
            orderTotals.total = cartTotals.total
            orderTotals.items_count = cartTotals.items_count
            console.log('📊 Using cart totals for order:', orderTotals)
          }
          
          console.log('📦 Completed order details:', {
            order_id: completedOrder.id,
            email: completedOrder.email,
            customer_id: completedOrder.customer_id,
            subtotal: orderTotals.subtotal,
            discount_total: orderTotals.discount_total,
            total: orderTotals.total,
            items_count: orderTotals.items_count,
            currency_code: completedOrder.currency_code,
            status: completedOrder.status
          })
          
          return res.json({ 
            order: {
              order_id: completedOrder.id,
              email: completedOrder.email,
              customer_id: completedOrder.customer_id,
              subtotal: orderTotals.subtotal,
              discount_total: orderTotals.discount_total,
              total: orderTotals.total,
              items_count: orderTotals.items_count,
              currency_code: completedOrder.currency_code,
              status: completedOrder.status,
              items: completedOrder.items
            },
            success: true,
            message: 'Order completed successfully!'
          })
          
        } catch (error) {
          console.error('❌ Order completion failed:', error)
          return res.status(400).json({ 
            error: 'Order completion failed',
            success: false,
            message: error.message || 'Failed to complete order. Please try again.'
          })
        }

      case 'get_cart':
        try {
          const existingCart = await cartModuleService.retrieveCart(cart_id, {
            relations: ['items', 'items.adjustments']
          })
          
          // Calculate totals
          calculateCartTotals(existingCart)
          
          return res.json({ cart: existingCart })
        } catch (error) {
          console.error('❌ Get cart failed:', error)
          return res.status(400).json({ 
            error: 'Failed to get cart',
            success: false,
            message: error.message || 'Failed to retrieve cart.'
          })
        }

      default:
        return res.status(400).json({ error: `Unknown operation: ${operation}` })
    }
  } catch (error) {
    console.error('Cart operation error:', error)
    res.status(400).json({ error: error.message })
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log('User in GET request:', (req as any).user ? `${(req as any).user.id}` : 'None')
    
    const { cart_id } = req.query
    const cartModuleService = req.scope.resolve(Modules.CART)
    
    if (cart_id) {
      const cart = await cartModuleService.retrieveCart(cart_id as string, {
        relations: ['items', 'items.adjustments']
      })
      
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" })
      }
      
      // Calculate totals
      calculateCartTotals(cart)
      
      return res.json({ cart })
    } else {
      // Get all active carts (if needed for admin)
      const activeCarts = await cartModuleService.listCarts()
      
      // Calculate totals for each cart
      activeCarts.forEach(calculateCartTotals)
      
      return res.json({ carts: activeCarts })
    }
  } catch (error) {
    console.error('Get cart error:', error)
    res.status(400).json({ error: error.message })
  }
}
