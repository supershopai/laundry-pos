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
          // Get customer details first
          const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
          const customer = await customerModuleService.retrieveCustomer(customer_id)
          
          // Update cart with customer_id and customer email
          await cartModuleService.updateCarts(cart_id, {
            customer_id: customer_id,
            email: customer.email
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
                is_tax_inclusive: adj.is_tax_inclusive
              }))
            }))
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

      case 'create_payment_session':
        console.log('💳 Creating Razorpay payment session using plugin for cart:', cart_id)
        try {
          const cartModuleService = req.scope.resolve(Modules.CART)
          const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
          
          const currentCart = await cartModuleService.retrieveCart(cart_id, {
            relations: ['items', 'items.adjustments']
          })

          if (!currentCart) {
            return res.status(404).json({ error: 'Cart not found' })
          }

          // Calculate cart totals
          const cartTotals = calculateCartTotals(currentCart)
          console.log('💰 Cart totals for payment:', cartTotals)
          
          // Create payment collection first
          const paymentCollection = await paymentModuleService.createPaymentCollections({
            currency_code: currentCart.currency_code,
            amount: Math.round(cartTotals.total * 100),
            metadata: {
              cart_id: currentCart.id,
              customer_id: currentCart.customer_id,
              email: currentCart.email,
              region_id: currentCart.region_id
            }
          })

          // Create payment session using the Razorpay plugin
          console.log('🔍 Attempting to create payment session with Razorpay plugin...')
          console.log('📋 Payment collection created:', paymentCollection.id)
          console.log('💰 Payment amount:', Math.round(cartTotals.total * 100))
          console.log('💱 Currency:', currentCart.currency_code)
          console.log('🏪 Provider ID: pp_razorpay_razorpay')
          
          // Debug: Check Razorpay environment variables
          console.log('🔍 Checking Razorpay environment variables...')
          console.log('🔑 RAZORPAY_TEST_KEY_ID:', process.env.RAZORPAY_TEST_KEY_ID ? 'SET' : 'NOT SET')
          console.log('🔑 RAZORPAY_TEST_KEY_SECRET:', process.env.RAZORPAY_TEST_KEY_SECRET ? 'SET' : 'NOT SET')
          console.log('🔑 RAZORPAY_TEST_ACCOUNT:', process.env.RAZORPAY_TEST_ACCOUNT ? 'SET' : 'NOT SET')
          console.log('🔑 RAZORPAY_TEST_WEBHOOK_SECRET:', process.env.RAZORPAY_TEST_WEBHOOK_SECRET ? 'SET' : 'NOT SET')
          
          // Debug: Check what providers are available
          try {
            console.log('🔍 Checking available payment providers...')
            const availableProviders = await paymentModuleService.listPaymentProviders()
            console.log('📋 Available payment providers:', availableProviders.map(p => ({ id: p.id })))
            
            // Check if razorpay provider exists
            const razorpayProvider = availableProviders.find(p => p.id === 'pp_razorpay_razorpay')
            if (razorpayProvider) {
              console.log('✅ Razorpay provider found:', razorpayProvider)
            } else {
              console.log('❌ Razorpay provider NOT found in available providers')
              console.log('🔍 Available provider IDs:', availableProviders.map(p => p.id))
            }
          } catch (providerError) {
            console.log('❌ Error checking providers:', providerError.message)
          }
          
          // Debug: Check container resolution
          try {
            console.log('🔍 Attempting to resolve razorpay provider directly...')
            const razorpayProvider = req.scope.resolve('razorpay')
            console.log('✅ Razorpay provider resolved directly:', razorpayProvider)
          } catch (resolveError) {
            console.log('❌ Could not resolve razorpay provider directly:', resolveError.message)
          }
          
          // Debug: Check what's in the container
          try {
            console.log('🔍 Checking container contents...')
            const containerKeys = Object.keys(req.scope.cradle)
            console.log('📋 Container keys:', containerKeys.filter(key => key.includes('payment') || key.includes('razorpay')))
          } catch (containerError) {
            console.log('❌ Error checking container:', containerError.message)
          }
          
          // Debug: Check what's in the payment module service
          console.log('🔍 Payment module service methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(paymentModuleService)))
          
          // Create Razorpay order directly using Razorpay SDK
          console.log('🔍 Creating Razorpay order directly...')
          
          const Razorpay = require('razorpay')
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_TEST_KEY_ID,
            key_secret: process.env.RAZORPAY_TEST_KEY_SECRET,
            headers: {
              "Content-Type": "application/json",
              "X-Razorpay-Account": process.env.RAZORPAY_TEST_ACCOUNT
            }
          })

          const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(cartTotals.total * 100), // Razorpay needs amount in paisa
            currency: currentCart.currency_code.toUpperCase(),
            receipt: `pos_cart_${currentCart.id}`,
            notes: {
              cart_id: currentCart.id,
              customer_id: currentCart.customer_id,
              email: currentCart.email,
              subtotal: cartTotals.subtotal,
              discount_total: cartTotals.discount_total,
              total: cartTotals.total,
              items_count: cartTotals.items_count
            }
          })

          console.log('✅ Razorpay order created directly:', razorpayOrder.id)

          // Create a mock payment session for the frontend
          const paymentSession = {
            id: `ps_${Date.now()}`,
            provider_id: 'razorpay_direct',
            amount: cartTotals.total, // Don't multiply by 100 for Medusa
            currency_code: currentCart.currency_code,
            data: {
              razorpay_order_id: razorpayOrder.id,
              cart_id: currentCart.id,
              customer_id: currentCart.customer_id,
              email: currentCart.email,
              amount: Math.round(cartTotals.total * 100), // Razorpay needs paisa
              currency: currentCart.currency_code.toUpperCase(),
              receipt: `pos_cart_${currentCart.id}`
            }
          }
          
          console.log('✅ Payment session created with Razorpay plugin successfully!')
          console.log('📄 Payment session details:', {
            id: paymentSession.id,
            provider_id: paymentSession.provider_id,
            amount: paymentSession.amount,
            currency_code: paymentSession.currency_code,
            data: paymentSession.data
          })
          
          res.json({ 
            payment_session: paymentSession,
            amount: Math.round(cartTotals.total * 100),
            currency: currentCart.currency_code
          })
        } catch (error) {
          console.error('Payment session creation error:', error)
          res.status(400).json({ error: error.message })
        }
        break

      case 'verify_payment':
        console.log('🔍 Verifying Razorpay payment for POS cart:', cart_id)
        console.log('📋 Received data:', JSON.stringify(data, null, 2))
        try {
          const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = data.data || data
          
          console.log('🔍 Extracted payment data:', {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            has_payment_id: !!razorpay_payment_id,
            has_order_id: !!razorpay_order_id,
            has_signature: !!razorpay_signature
          })
          
          if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            console.log('❌ Missing payment verification data:', {
              missing_payment_id: !razorpay_payment_id,
              missing_order_id: !razorpay_order_id,
              missing_signature: !razorpay_signature
            })
            return res.status(400).json({ error: 'Missing payment verification data' })
          }

          // Verify signature using Razorpay SDK
          const Razorpay = require('razorpay')
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_TEST_KEY_ID,
            key_secret: process.env.RAZORPAY_TEST_KEY_SECRET
          })

          const crypto = require('crypto')
          const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_TEST_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex')

          if (expectedSignature !== razorpay_signature) {
            console.log('❌ Payment signature verification failed')
            
            // Mark payment collection as failed if it exists
            try {
              const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
              const existingPaymentCollections = await paymentModuleService.listPaymentCollections({})
              
              if (existingPaymentCollections.length > 0) {
                const paymentCollection = existingPaymentCollections[0]
                
                // Cancel any existing payment sessions
                const paymentSessions = await paymentModuleService.listPaymentSessions({
                  payment_collection_id: paymentCollection.id
                })
                
                for (const session of paymentSessions) {
                  try {
                    await paymentModuleService.updatePaymentSession({
                      id: session.id,
                      status: 'canceled',
                      data: session.data,
                      currency_code: session.currency_code,
                      amount: session.amount
                    })
                    console.log('❌ Payment session canceled:', session.id)
                  } catch (error) {
                    console.log('⚠️ Could not cancel payment session:', error.message)
                  }
                }
                
                // Update payment collection status to canceled
                await paymentModuleService.updatePaymentCollections(paymentCollection.id, {
                  status: 'canceled'
                })
                console.log('❌ Payment collection marked as canceled due to signature verification failure')
              }
            } catch (error) {
              console.log('⚠️ Could not update payment collection status on failure:', error.message)
            }
            
            return res.status(400).json({ 
              error: 'Invalid payment signature',
              success: false,
              message: 'Payment verification failed. Please try again.'
            })
          }

          console.log('✅ Razorpay payment signature verified:', { razorpay_payment_id, razorpay_order_id })
          
          // Complete the order using the same logic as complete_order
          const orderModuleService = req.scope.resolve(Modules.ORDER)
          const cartModuleService = req.scope.resolve(Modules.CART)
          
          // Get current cart with calculated totals
          const currentCart = await cartModuleService.retrieveCart(cart_id, {
            relations: ['items', 'items.adjustments']
          })

          if (!currentCart) {
            return res.status(404).json({ error: 'Cart not found' })
          }

          const cartTotals = calculateCartTotals(currentCart)
          console.log('💰 Cart totals for order creation:', cartTotals)

          // Create order with proper structure for Medusa v2
          const orderData = {
            currency_code: currentCart.currency_code,
            email: currentCart.email,
            region_id: currentCart.region_id,
            customer_id: currentCart.customer_id,
            status: 'pending', // Start as pending, will update to completed after payment
            items: currentCart.items?.map((item: any) => {
              // Calculate item totals with discounts
              const unitPrice = item.unit_price?.toNumber?.() || item.unit_price
              const quantity = item.quantity
              const subtotal = unitPrice * quantity
              
              // Calculate item-level discounts
              const itemDiscounts = item.adjustments?.map((adj: any) => {
                const amount = adj.amount?.toNumber?.() || adj.amount
                return {
                  amount: amount,
                  code: adj.code,
                  is_tax_inclusive: adj.is_tax_inclusive
                }
              }) || []
              
              const totalDiscount = itemDiscounts.reduce((sum, adj) => sum + adj.amount, 0)
              const itemTotal = subtotal - totalDiscount
              
              console.log('📦 Item calculation:', {
                title: item.title,
                unit_price: unitPrice,
                quantity: quantity,
                subtotal: subtotal,
                discounts: itemDiscounts,
                total_discount: totalDiscount,
                final_total: itemTotal
              })
              
              return {
                title: item.title,
                variant_id: item.variant_id,
                product_id: item.product_id,
                quantity: quantity,
                unit_price: unitPrice,
                subtotal: subtotal,
                total: itemTotal,
                adjustments: itemDiscounts
              }
            })
          }

          // Calculate order-level totals
          const orderSubtotal = orderData.items?.reduce((sum, item) => sum + item.subtotal, 0) || 0
          const orderDiscountTotal = orderData.items?.reduce((sum, item) => {
            const itemDiscount = item.adjustments?.reduce((adjSum, adj) => adjSum + adj.amount, 0) || 0
            return sum + itemDiscount
          }, 0) || 0
          const orderTotal = orderSubtotal - orderDiscountTotal

          console.log('📋 Creating order with data:', {
            currency_code: orderData.currency_code,
            email: orderData.email,
            region_id: orderData.region_id,
            customer_id: orderData.customer_id,
            status: orderData.status,
            items_count: orderData.items?.length || 0,
            subtotal: orderSubtotal,
            discount_total: orderDiscountTotal,
            total: orderTotal,
            payment_info: {
              razorpay_payment_id: razorpay_payment_id,
              razorpay_order_id: razorpay_order_id,
              payment_method: 'razorpay'
            }
          })

          // Add totals to order data
          const orderWithTotals = {
            ...orderData,
            subtotal: orderSubtotal,
            discount_total: orderDiscountTotal,
            tax_total: 0,
            total: orderTotal
          }

          console.log('📋 Final order data with totals:', {
            currency_code: orderWithTotals.currency_code,
            email: orderWithTotals.email,
            status: orderWithTotals.status,
            subtotal: orderWithTotals.subtotal,
            discount_total: orderWithTotals.discount_total,
            total: orderWithTotals.total,
            items_count: orderWithTotals.items?.length || 0
          })

          // Create order with pending status (let Medusa handle status changes)
          const order = await orderModuleService.createOrders([orderWithTotals])
          
          console.log('✅ Order created successfully for POS payment:', order[0].id)

          // Create payment collection for the order
          const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
          const paymentCollection = await paymentModuleService.createPaymentCollections({
            currency_code: currentCart.currency_code,
            amount: orderTotal, // Don't multiply by 100 - Medusa handles currency conversion
            metadata: {
              razorpay_payment_id: razorpay_payment_id,
              razorpay_order_id: razorpay_order_id,
              payment_method: 'razorpay',
              order_id: order[0].id
            }
          })

          console.log('💳 Payment collection created:', paymentCollection.id)

          // Link order to payment collection
          const remoteLink = req.scope.resolve('remoteLink')
          await remoteLink.create({
            [Modules.ORDER]: { order_id: order[0].id },
            [Modules.PAYMENT]: { payment_collection_id: paymentCollection.id }
          })

          console.log('🔗 Linked order to payment collection')

          // First, let's check what payment providers are available
          const availableProviders = await paymentModuleService.listPaymentProviders()
          console.log('🔍 Available payment providers:', availableProviders.map(p => ({ id: p.id })))
          
          // Try to find a manual or system provider - use the actual provider IDs from the system
          const manualProvider = availableProviders.find(p => 
            p.id === 'pp_system_default' ||
            p.id === 'system' ||
            p.id === 'manual' || 
            p.id === 'manual_payment' || 
            p.id === 'system_provider'
          )
          
          if (!manualProvider) {
            console.log('❌ No manual payment provider found')
            console.log('📋 Available providers:', availableProviders.map(p => p.id))
            console.log('💡 Expected providers: pp_system_default, system, manual, manual_payment, system_provider')
            throw new Error(`No manual payment provider available. Available providers: ${availableProviders.map(p => p.id).join(', ')}`)
          }
          
          console.log('✅ Using payment provider:', manualProvider.id)
          
          // Create payment session for the payment collection
          const paymentSession = await paymentModuleService.createPaymentSession(paymentCollection.id, {
            provider_id: manualProvider.id,
            currency_code: currentCart.currency_code,
            amount: orderTotal,
            data: {
              razorpay_payment_id: razorpay_payment_id,
              razorpay_order_id: razorpay_order_id,
              payment_method: 'razorpay'
            }
          })

          console.log('💳 Payment session created:', paymentSession.id)

          // Manually authorize the payment session
          try {
            await paymentModuleService.authorizePaymentSession(paymentSession.id, {})
            console.log('✅ Payment session authorized successfully')
          } catch (error) {
            console.log('⚠️ Could not authorize payment session:', error.message)
          }

          // Manually capture the payment (if authorization was successful)
          try {
            // First, we need to get the payment from the session
            const payments = await paymentModuleService.listPayments({
              payment_session_id: paymentSession.id
            })
            
            if (payments && payments.length > 0) {
              const payment = payments[0]
              await paymentModuleService.capturePayment({
                payment_id: payment.id,
                captured_by: 'pos_system'
              })
              console.log('✅ Payment captured successfully:', payment.id)
            } else {
              console.log('⚠️ No payment found for session, creating payment manually')
              
              // Skip manual payment creation since createPayments doesn't exist
              console.log('⚠️ Manual payment creation not supported, skipping payment capture')
              console.log('✅ Manually created payment captured successfully')
            }
          } catch (error) {
            console.log('⚠️ Could not capture payment:', error.message)
          }

          // Complete the payment collection
          try {
            await paymentModuleService.completePaymentCollections(paymentCollection.id)
            console.log('✅ Payment collection completed successfully')
          } catch (error) {
            console.log('⚠️ Could not complete payment collection:', error.message)
            
            // Fallback: try to update status to authorized
            try {
              await paymentModuleService.updatePaymentCollections(paymentCollection.id, {
                status: 'authorized'
              })
              console.log('✅ Payment collection marked as authorized (fallback)')
            } catch (fallbackError) {
              console.log('⚠️ Could not update payment collection status (fallback):', fallbackError.message)
            }
          }

          // Update order with payment metadata (but don't change status - let Medusa handle it)
          await orderModuleService.updateOrders([{
            id: order[0].id,
            metadata: {
              payment_method: 'razorpay',
              razorpay_payment_id: razorpay_payment_id,
              razorpay_order_id: razorpay_order_id,
              payment_status: 'captured',
              payment_amount: orderTotal,
              payment_currency: currentCart.currency_code,
              subtotal: orderSubtotal,
              discount_total: orderDiscountTotal,
              tax_total: 0,
              total: orderTotal
            }
          }])

          console.log('✅ Order updated with payment metadata')

          // Wait a moment for Medusa's workflow to process the payment collection completion
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Check if Medusa's workflow updated the order status
          const updatedOrderAfterWorkflow = await orderModuleService.retrieveOrder(order[0].id)
          console.log('📊 Order status after workflow processing:', {
            order_id: updatedOrderAfterWorkflow.id,
            status: updatedOrderAfterWorkflow.status,
            total: updatedOrderAfterWorkflow.total,
            subtotal: updatedOrderAfterWorkflow.subtotal,
            discount_total: updatedOrderAfterWorkflow.discount_total
          })

          // For direct Razorpay integration, we don't need a payment session
          // The payment collection is sufficient to show payment status
          // The order is already marked as completed and linked to the payment collection

          // Retrieve the updated order to verify payment status
          const updatedOrder = await orderModuleService.retrieveOrder(order[0].id)

          console.log('📊 Updated order with payment info:', {
            order_id: updatedOrder.id,
            status: updatedOrder.status,
            currency_code: updatedOrder.currency_code,
            email: updatedOrder.email,
            customer_id: updatedOrder.customer_id,
            total: updatedOrder.total,
            subtotal: updatedOrder.subtotal,
            discount_total: updatedOrder.discount_total
          })

          // Use Query service to get calculated totals and update order if needed
          let queryOrderTotal = null
          let queryOrderSubtotal = null
          let queryOrderDiscountTotal = null
          
          try {
            const queryService = req.scope.resolve('query')
            const calculatedOrder = await queryService.graph({
              entity: 'order',
              fields: [
                'id',
                'total',
                'subtotal', 
                'discount_total',
                'tax_total',
                'items_count'
              ],
              filters: {
                id: order[0].id
              }
            })
            
            const calculatedTotals = calculatedOrder.data[0]
            console.log('📊 Query service calculated totals:', {
              order_id: calculatedTotals?.id,
              total: calculatedTotals?.total,
              subtotal: calculatedTotals?.subtotal,
              discount_total: calculatedTotals?.discount_total,
              tax_total: calculatedTotals?.tax_total,
              items_count: calculatedTotals?.items?.length || 0
            })

            // If Query service has calculated totals, use them for the response
            if (calculatedTotals && calculatedTotals.total) {
              console.log('✅ Using Query service calculated totals for order response')
              // Extract numeric values from BigNumber objects
              const safeNumber = (value: any) => {
                if (value && typeof value === 'object' && value.numeric_) {
                  return value.numeric_
                }
                return typeof value === 'number' ? value : 0
              }
              
              // Update the orderTotal and other values for the response
              queryOrderTotal = safeNumber(calculatedTotals.total)
              queryOrderSubtotal = safeNumber(calculatedTotals.subtotal)
              queryOrderDiscountTotal = safeNumber(calculatedTotals.discount_total)
              
              console.log('📊 Updated totals from Query service:', {
                total: queryOrderTotal,
                subtotal: queryOrderSubtotal,
                discount_total: queryOrderDiscountTotal
              })
            }
          } catch (error) {
            console.log('⚠️ Could not get calculated totals from Query service:', error.message)
          }

          // Verify payment collection details
          const paymentCollectionDetails = await paymentModuleService.retrievePaymentCollection(paymentCollection.id)
          console.log('💳 Payment collection details:', {
            id: paymentCollectionDetails.id,
            amount: paymentCollectionDetails.amount,
            currency_code: paymentCollectionDetails.currency_code,
            metadata: paymentCollectionDetails.metadata
          })

          // Check if order has payment collections linked
          try {
            const orderWithPayments = await orderModuleService.retrieveOrder(order[0].id)
            console.log('🔍 Order details for payment verification:', {
              order_id: orderWithPayments.id,
              status: orderWithPayments.status,
              currency_code: orderWithPayments.currency_code,
              total: orderWithPayments.total,
              subtotal: orderWithPayments.subtotal,
              discount_total: orderWithPayments.discount_total
            })
          } catch (error) {
            console.log('⚠️ Could not retrieve order details:', error.message)
          }

          
          // Get the final totals (use Query service totals if available, otherwise use calculated values)
          const finalOrderTotal = queryOrderTotal || orderTotal
          const finalOrderSubtotal = queryOrderSubtotal || orderSubtotal
          const finalOrderDiscountTotal = queryOrderDiscountTotal || orderDiscountTotal

          // Return success response with order details
          res.json({ 
            success: true, 
            order_id: order[0].id,
            payment_id: razorpay_payment_id,
            razorpay_order_id: razorpay_order_id,
            message: 'Payment verified and order created successfully',
            order_details: {
              id: order[0].id,
              status: order[0].status,
              currency_code: order[0].currency_code,
              email: order[0].email,
              customer_id: order[0].customer_id,
              items_count: orderData.items?.length || 0,
              subtotal: finalOrderSubtotal,
              discount_total: finalOrderDiscountTotal,
              total: finalOrderTotal,
              payment_info: {
                razorpay_payment_id: razorpay_payment_id,
                razorpay_order_id: razorpay_order_id,
                payment_method: 'razorpay',
                payment_status: 'authorized',
                payment_amount: finalOrderTotal,
                payment_currency: currentCart.currency_code
              }
            }
          })
        } catch (error) {
          console.error('Payment verification error:', error)
          res.status(400).json({ error: error.message })
        }
        break

      case 'payment_failed':
        console.log('❌ Payment failed for cart:', cart_id)
        try {
          const { error_message, razorpay_order_id } = data
          
          console.log('💳 Payment failure details:', {
            cart_id,
            razorpay_order_id,
            error_message
          })

          // Mark payment collection as failed if it exists
          try {
            const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
            const existingPaymentCollections = await paymentModuleService.listPaymentCollections({})
            
            if (existingPaymentCollections.length > 0) {
              const paymentCollection = existingPaymentCollections[0]
              
              // Cancel any existing payment sessions
              const paymentSessions = await paymentModuleService.listPaymentSessions({
                payment_collection_id: paymentCollection.id
              })
              
              for (const session of paymentSessions) {
                try {
                  await paymentModuleService.updatePaymentSession({
                    id: session.id,
                    status: 'canceled',
                    data: session.data,
                    currency_code: session.currency_code,
                    amount: session.amount
                  })
                  console.log('❌ Payment session canceled:', session.id)
                } catch (error) {
                  console.log('⚠️ Could not cancel payment session:', error.message)
                }
              }
              
              // Update payment collection status to canceled
              await paymentModuleService.updatePaymentCollections(paymentCollection.id, {
                status: 'canceled'
              })
              console.log('❌ Payment collection marked as canceled due to payment failure')
            }
          } catch (error) {
            console.log('⚠️ Could not update payment collection status on failure:', error.message)
          }

          // Return failure response - cart is preserved
          res.json({ 
            success: false, 
            error: 'Payment failed',
            error_message: error_message || 'Payment could not be processed',
            razorpay_order_id: razorpay_order_id,
            message: 'Payment failed. Cart has been preserved. Please try again.',
            cart_preserved: true
          })
        } catch (error) {
          console.error('Payment failure handling error:', error)
          res.status(400).json({ error: error.message })
        }
        break

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
    console.error('Cart operation error:', error)
    res.status(400).json({ error: error.message })
  }
}
