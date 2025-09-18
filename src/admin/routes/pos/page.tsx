import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useState, useEffect } from "react"
import { Products } from "./components/Products"
import { Cart } from "./components/Cart"

interface Price {
  id: string
  currency_code: string
  amount: number
}

interface ProductVariant {
  id: string
  title: string
  sku?: string
  prices: Price[]
}

interface ProductCategory {
  id: string
  name: string
  handle?: string
  description?: string
}

interface Product {
  id: string
  title: string
  description?: string
  thumbnail?: string
  images?: { id: string; url: string }[]
  categories?: ProductCategory[]
  type?: { id: string; value: string } | null
  variants: ProductVariant[]
}

interface Customer {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
}

interface CartItem {
  product_id: string
  variant_id: string
  quantity: number
  unit_price: number
  currency_code: string
  title: string
  variant_title?: string
  sku?: string
}

interface Cart {
  id: string
  items: CartItem[]
  customer_id?: string
  discount_code?: string
  discount_amount: number
  subtotal: number
  tax_amount: number
  total: number
  currency_code?: string
}

const POSPage = () => {
  // State
  const [dataLoading, setDataLoading] = useState(true)
  const [cart, setCart] = useState<Cart | null>(null)
  const [initializationError, setInitializationError] = useState<string | null>(null)
  const [orderSuccessDialog, setOrderSuccessDialog] = useState<{
    isOpen: boolean
    orderId: string | null
    isSuccess: boolean
    message: string
  }>({
    isOpen: false,
    orderId: null,
    isSuccess: false,
    message: ''
  })
  const [productSearch, setProductSearch] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [discountCode, setDiscountCode] = useState("")
  const [discountMessage, setDiscountMessage] = useState<{
    type: 'success' | 'error' | null
    text: string
  }>({ type: null, text: '' })
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Initialize cart and load all data on component mount
  useEffect(() => {
    // Wrap in async function to handle errors gracefully
    const initialize = async () => {
      try {
        setDataLoading(true)
        setInitializationError(null)
        await loadAllData()
        await initializeCart()
        console.log('✅ POS initialized successfully')
      } catch (error) {
        console.error('Failed to initialize POS:', error)
        setInitializationError(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`)
        // Don't crash the component, just show error state
      } finally {
        setDataLoading(false)
      }
    }
    initialize()
  }, [])

  // Filter products when search term or category changes
  useEffect(() => {
    filterProducts()
  }, [productSearch, selectedCategory, allProducts])

  // Filter customers when search term changes
  useEffect(() => {
    filterCustomers()
  }, [customerSearch, allCustomers])

  const initializeCart = async () => {
    try {
      console.log('🛒 Frontend: Initializing cart...')
      console.log('🛒 Frontend: Current URL:', window.location.href)
      console.log('🛒 Frontend: Making request to:', '/admin/pos/cart-operations')
      
      const response = await fetch('/admin/pos/cart-operations', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Include cookies for admin authentication
        body: JSON.stringify({ operation: 'create_cart' })
      })
      
      console.log('📥 Frontend: Cart initialization response status:', response.status)
      console.log('📥 Frontend: Cart initialization response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Frontend: Cart initialization failed:', errorText)
        console.error('❌ Frontend: Response status:', response.status)
        console.error('❌ Frontend: Response headers:', Object.fromEntries(response.headers.entries()))
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ Frontend: Cart initialization successful:', data)
      
      if (!data.cart) {
        console.error('❌ Frontend: No cart in response data:', data)
        throw new Error('No cart returned from server')
      }
      
      setCart(data.cart)
      console.log('✅ Frontend: Cart state updated:', data.cart.id)
      console.log('🛒 Frontend: Cart structure:', JSON.stringify(data.cart, null, 2))
    } catch (error) {
      console.error("❌ Frontend: Failed to initialize cart:", error)
      console.error("❌ Frontend: Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  const loadAllData = async () => {
    try {
      setDataLoading(true)
      console.log("POS Data API called - fetching all data...")
      
      const response = await fetch('/admin/pos/data')
      const data = await response.json()
      
      // Set all data
      setAllProducts(data.products || [])
      setAllCustomers(data.customers || [])
      setCategories(data.categories || [])
      
      // Set filtered data initially
      setFilteredProducts(data.products || [])
      setFilteredCustomers(data.customers || [])
      
      console.log(`Loaded ${data.counts?.products || 0} products, ${data.counts?.categories || 0} categories, ${data.counts?.customers || 0} customers`)
      
      // Debug: Count products per category
      if (data.categories && data.products) {
        data.categories.forEach((category: ProductCategory) => {
          const productCount = data.products.filter((product: Product) => 
            product.categories?.some(c => c.id === category.id)
          ).length
          console.log(`Category "${category.name}" (${category.id}): ${productCount} products`)
        })
      }
      
      // Debug: Log first product to see structure
      if (data.products && data.products.length > 0) {
        console.log('Frontend - First product:', data.products[0])
        console.log('Frontend - First product categories:', data.products[0].categories)
        if (data.products[0].variants && data.products[0].variants.length > 0) {
          console.log('Frontend - First variant:', data.products[0].variants[0])
        }
        
        // Log all products and their categories for debugging filtering
        data.products.forEach((product: Product, index: number) => {
          console.log(`Frontend Product ${index + 1} (${product.title}):`, product.categories?.map((c: ProductCategory) => `${c.id}:${c.name}`) || 'No categories')
        })
      }
    } catch (error) {
      console.error("Failed to load POS data:", error)
      // Set empty arrays on error
      setAllProducts([])
      setAllCustomers([])
      setCategories([])
      setFilteredProducts([])
      setFilteredCustomers([])
    } finally {
      setDataLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = [...allProducts]
    
    console.log(`Filtering products: selectedCategory="${selectedCategory}", total products=${allProducts.length}`)
    
    // Debug: Log all available categories
    console.log('Available categories:', categories.map(c => `${c.id}:${c.name}`))
    
    // Filter by category
    if (selectedCategory !== "all") {
      console.log('Filtering by category:', selectedCategory)
      
      // Debug: Check if the selectedCategory exists in our categories list
      const categoryExists = categories.find(c => c.id === selectedCategory)
      console.log('Selected category exists in categories list:', categoryExists ? `Yes (${categoryExists.name})` : 'No')
      
      filtered = filtered.filter(product => {
        // Debug each product's categories
        const productCategories = product.categories || []
        console.log(`Product "${product.title}" categories:`, productCategories.map(c => `${c.id}:${c.name}`))
        
        const hasCategory = productCategories.some(category => {
          const match = category.id === selectedCategory
          console.log(`  - Category "${category.name}" (${category.id}) matches ${selectedCategory}: ${match}`)
          return match
        })
        
        console.log(`Product ${product.title} has category ${selectedCategory}:`, hasCategory)
        return hasCategory
      })
      console.log(`After category filter: ${filtered.length} products`)
      
      // If no products found, let's debug further
      if (filtered.length === 0) {
        console.log('DEBUG: No products found after filtering. Checking data structure...')
        allProducts.forEach((product, index) => {
          console.log(`Product ${index + 1}:`, {
            title: product.title,
            id: product.id,
            categories: product.categories?.map(c => ({ id: c.id, name: c.name })) || []
          })
        })
      }
    }
    
    // Filter by search term
    if (productSearch.length > 0) {
      console.log('Filtering by search:', productSearch)
      const searchTerm = productSearch.toLowerCase()
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
      )
      console.log(`After search filter: ${filtered.length} products`)
    }
    
    console.log('Final filtered products:', filtered.length)
    setFilteredProducts(filtered)
  }

  const filterCustomers = () => {
    let filtered = [...allCustomers]
    
    // Filter by search term
    if (customerSearch.length > 0) {
      const searchTerm = customerSearch.toLowerCase()
      filtered = filtered.filter(customer =>
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.first_name?.toLowerCase().includes(searchTerm) ||
        customer.last_name?.toLowerCase().includes(searchTerm) ||
        customer.phone?.includes(searchTerm)
      )
    }
    
    setFilteredCustomers(filtered)
  }

  const addToCart = async (product: Product, variant: ProductVariant) => {
    console.log('🛒 Frontend: Starting addToCart', { product: product.title, variant: variant.title })
    console.log('🛒 Frontend: Current cart state:', cart)
    
    if (!cart) {
      console.error('❌ Frontend: No cart available - attempting to reinitialize...')
      try {
        await initializeCart()
        // Give a moment for the state to update
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Check if cart is now available after reinitialization
        if (!cart) {
          console.error('❌ Frontend: Cart still not available after reinitialization')
          alert('Failed to initialize cart. Please refresh the page.')
          return
        }
        console.log('✅ Frontend: Cart reinitialized successfully:', (cart as any)?.id)
      } catch (error) {
        console.error('❌ Frontend: Failed to reinitialize cart:', error)
        alert('Failed to initialize cart. Please refresh the page.')
        return
      }
    }

    try {
      const price = variant.prices[0] // Use first available price without currency preference
      if (!price) {
        console.error('❌ Frontend: No price available for variant')
        alert("No price available for this variant")
        return
      }

      console.log('💰 Frontend: Using price', price)

      const requestBody = {
        operation: 'add_item',
        cart_id: cart.id,
        product_id: product.id,
        variant_id: variant.id,
        unit_price: price.amount, // Use actual price from Medusa (not divided by 100)
        currency_code: price.currency_code, // Include currency from product
        title: product.title,
        variant_title: variant.title,
        sku: variant.sku,
        quantity: 1
      }

      console.log('📤 Frontend: Sending request to /admin/pos/cart-operations', requestBody)

      const response = await fetch('/admin/pos/cart-operations', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 Frontend: Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Frontend: Response error:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Frontend: Response data:', data)
      console.log('🛒 Frontend: Cart structure:', JSON.stringify(data.cart, null, 2))
      console.log('🛒 Frontend: Cart totals - subtotal:', data.cart?.subtotal, 'tax:', data.cart?.tax_amount, 'total:', data.cart?.total)
      setCart(data.cart)
    } catch (error) {
      console.error("❌ Frontend: Failed to add to cart:", error)
    }
  }

  const updateQuantity = async (variantId: string, quantity: number) => {
    if (!cart) return

    try {
      const response = await fetch('/admin/pos/cart-operations', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: 'update_quantity',
          cart_id: cart.id,
          variant_id: variantId,
          quantity: quantity
        })
      })
      const data = await response.json()
      setCart(data.cart)
    } catch (error) {
      console.error("Failed to update quantity:", error)
    }
  }

  const removeFromCart = async (variantId: string) => {
    if (!cart) return

    try {
      const response = await fetch('/admin/pos/cart-operations', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: 'remove_item',
          cart_id: cart.id,
          variant_id: variantId
        })
      })
      const data = await response.json()
      setCart(data.cart)
    } catch (error) {
      console.error("Failed to remove from cart:", error)
    }
  }

  const setCustomer = async (customer: Customer) => {
    if (!cart) return

    try {
      const response = await fetch('/admin/pos/cart-operations', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: 'set_customer',
          cart_id: cart.id,
          customer_id: customer.id
        })
      })
      const data = await response.json()
      console.log('🎫 Frontend: Cart after setting customer:', JSON.stringify(data.cart, null, 2))
      setCart(data.cart)
      setSelectedCustomer(customer)
    } catch (error) {
      console.error("Failed to set customer:", error)
    }
  }

  const applyDiscount = async () => {
    if (!cart || !discountCode.trim()) return

    try {
      console.log('🎫 Frontend: Applying discount code:', discountCode)
      
      const response = await fetch('/admin/pos/cart-operations', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: 'apply_discount',
          cart_id: cart.id,
          discount_code: discountCode.trim()
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Success: Update cart and show success message
        console.log('🎫 Frontend: Received discount response:', {
          subtotal: data.cart?.subtotal,
          discount_amount: data.cart?.discount_amount,
          tax_amount: data.cart?.tax_amount,
          total: data.cart?.total
        })
        setCart(data.cart)
        setDiscountMessage({
          type: 'success',
          text: data.message || 'Discount applied successfully!'
        })
        console.log('✅ Frontend: Discount applied successfully, cart updated')
        
        // Clear success message after 5 seconds (increased from 3)
        setTimeout(() => {
          setDiscountMessage({ type: null, text: '' })
        }, 5000)
        
      } else {
        // Error: Show error message, don't update cart
        setDiscountMessage({
          type: 'error',
          text: data.message || 'Failed to apply discount code.'
        })
        console.log('❌ Frontend: Discount application failed:', data.message)
        
        // Only auto-clear error messages that are not "code not found" type
        if (!data.message || !data.message.toLowerCase().includes('not valid')) {
          // Clear error message after 5 seconds for non-validation errors
          setTimeout(() => {
            setDiscountMessage({ type: null, text: '' })
          }, 5000)
        }
        // For "code not found" errors, keep the message until user acts
      }
      
    } catch (error) {
      console.error("❌ Frontend: Failed to apply discount:", error)
      setDiscountMessage({
        type: 'error',
        text: 'Network error. Please check your connection and try again.'
      })
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setDiscountMessage({ type: null, text: '' })
      }, 5000)
    }
  }

  const removeDiscount = async () => {
    if (!cart) return

    try {
      console.log('🎫 Frontend: Removing discount from cart')
      
      const response = await fetch('/admin/pos/cart-operations', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: 'remove_discount',
          cart_id: cart.id
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Success: Update cart and clear discount code
        setCart(data.cart)
        setDiscountCode('')
        setDiscountMessage({
          type: 'success',
          text: 'Discount removed successfully!'
        })
        console.log('✅ Frontend: Discount removed successfully')
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setDiscountMessage({ type: null, text: '' })
        }, 3000)
        
      } else {
        // Error: Show error message
        setDiscountMessage({
          type: 'error',
          text: data.message || 'Failed to remove discount.'
        })
        console.log('❌ Frontend: Discount removal failed:', data.message)
      }
      
    } catch (error) {
      console.error("❌ Frontend: Failed to remove discount:", error)
      setDiscountMessage({
        type: 'error',
        text: 'Network error. Please try again.'
      })
    }
  }

  const completeOrder = async (paymentMethod: string) => {
    if (!cart) return

    try {
      const response = await fetch('/admin/pos/cart-operations', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: 'complete_order',
          cart_id: cart.id,
          payment_method: paymentMethod
        })
      })
      const data = await response.json()
      
      if (response.ok) {
        // Show success dialog
        setOrderSuccessDialog({
          isOpen: true,
          orderId: data.order.order_id,
          isSuccess: true,
          message: 'Order completed successfully!'
        })
        
        // Use the new cart that was automatically created
        if (data.order.cart) {
          console.log('✅ Using new cart from order completion:', data.order.cart.id)
          setCart(data.order.cart)
        } else {
          // Fallback to creating a new cart if not provided
          await initializeCart()
        }
        setSelectedCustomer(null)
        setDiscountCode('')
      } else {
        // Show error dialog
        setOrderSuccessDialog({
          isOpen: true,
          orderId: null,
          isSuccess: false,
          message: 'Failed to complete order. Please try again.'
        })
      }
    } catch (error) {
      console.error("Failed to complete order:", error)
      // Show error dialog
      setOrderSuccessDialog({
        isOpen: true,
        orderId: null,
        isSuccess: false,
        message: 'Error completing order. Please check your connection and try again.'
      })
    }
  }


  const formatPrice = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const handleProductClick = (product: Product) => {
    if (product.variants.length > 1) {
      setSelectedProduct(product)
      setIsVariantDialogOpen(true)
    } else if (product.variants.length === 1) {
      addToCart(product, product.variants[0])
    }
  }


  // No JavaScript detection to avoid infinite loops

  // Show loading state
  if (dataLoading) {
    return (
      <div
        className="pos-main-container"
        style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          zIndex: 1000,
          transition: 'margin-left 0.3s ease'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007cba',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}
          />
          <div style={{ fontSize: '16px', color: '#666' }}>
            Loading POS System...
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (initializationError) {
    return (
      <div
        className="pos-main-container"
        style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          zIndex: 1000,
          transition: 'margin-left 0.3s ease'
        }}
      >
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '18px', color: '#dc3545', marginBottom: '16px' }}>
            ⚠️ POS System Error
          </div>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
            {initializationError}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007cba',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div 
        className="pos-main-container"
        style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          overflow: 'hidden',
          backgroundColor: 'var(--ui-bg-base)',
          color: 'var(--ui-fg-base)',
          fontFamily: 'Inter, sans-serif',
          zIndex: 1000,
          transition: 'margin-left 0.3s ease'
        }}
      >
        {/* Products Section */}
        <Products
          products={filteredProducts}
          categories={categories}
          selectedCategory={selectedCategory}
          productSearch={productSearch}
          dataLoading={dataLoading}
          onCategorySelect={setSelectedCategory}
          onProductSearch={setProductSearch}
          onProductClick={handleProductClick}
          onAddToCart={addToCart}
        />

        {/* Cart Section */}
        <Cart
          cart={cart}
          customers={filteredCustomers}
          selectedCustomer={selectedCustomer}
          discountCode={discountCode}
          discountMessage={discountMessage}
          customerSearch={customerSearch}
          dataLoading={dataLoading}
          formatPrice={formatPrice}
          onCustomerSearch={setCustomerSearch}
          onCustomerSelect={setCustomer}
          onUpdateQuantity={updateQuantity}
          onRemoveFromCart={removeFromCart}
          onDiscountCodeChange={(code) => {
            setDiscountCode(code)
            // Only clear discount message if user is actually changing the code
            // (not just when cart updates trigger a re-render)
            if (discountMessage.type && code !== discountCode) {
              setDiscountMessage({ type: null, text: '' })
            }
          }}
          onApplyDiscount={applyDiscount}
          onRemoveDiscount={removeDiscount}
          onCompleteOrder={completeOrder}
        />
      </div>

      {/* Variant Selection Dialog */}
      {isVariantDialogOpen && selectedProduct && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setIsVariantDialogOpen(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e5e7eb'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Select Variant - {selectedProduct.title}
              </h3>
              <button
                onClick={() => setIsVariantDialogOpen(false)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: 'var(--ui-fg-muted)'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedProduct.variants.map(variant => (
                <div
                  key={variant.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    border: '1px solid var(--ui-border-base)',
                    borderRadius: '6px',
                    backgroundColor: 'var(--ui-bg-subtle)'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                      {variant.title}
                    </div>
                    {variant.sku && (
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                        SKU: {variant.sku}
                      </div>
                    )}
                    <div style={{ fontSize: '16px', color: '#007cba', fontWeight: '600' }}>
                      {variant.prices.length > 0 && (
                        <span>
                          {variant.prices[0].currency_code.toUpperCase()} {variant.prices[0].amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      addToCart(selectedProduct, variant)
                      setIsVariantDialogOpen(false)
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      marginLeft: '16px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Order Success/Failure Dialog */}
      {orderSuccessDialog.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'slideInUp 0.3s ease-out'
          }}>
            {/* Success/Error Icon */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: orderSuccessDialog.isSuccess ? '#dcfce7' : '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: orderSuccessDialog.isSuccess ? 'bounceIn 0.6s ease-out' : 'shakeX 0.6s ease-out'
              }}>
                <span style={{ 
                  fontSize: '40px',
                  color: orderSuccessDialog.isSuccess ? '#16a34a' : '#dc2626'
                }}>
                  {orderSuccessDialog.isSuccess ? '✓' : '✗'}
                </span>
              </div>
            </div>

            {/* Title */}
            <h2 style={{
              textAlign: 'center',
              margin: '0 0 16px 0',
              fontSize: '24px',
              fontWeight: '700',
              color: orderSuccessDialog.isSuccess ? '#16a34a' : '#dc2626'
            }}>
              {orderSuccessDialog.isSuccess ? 'Order Completed!' : 'Order Failed'}
            </h2>

            {/* Message */}
            <p style={{
              textAlign: 'center',
              margin: '0 0 24px 0',
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              {orderSuccessDialog.message}
            </p>

            {/* Order ID */}
            {orderSuccessDialog.isSuccess && orderSuccessDialog.orderId && (
              <div style={{
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Order ID
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  fontFamily: 'monospace'
                }}>
                  {orderSuccessDialog.orderId}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              {orderSuccessDialog.isSuccess && orderSuccessDialog.orderId && (
                <a
                  href={`/app/orders/${orderSuccessDialog.orderId}`}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'inline-block',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                  }}
                >
                  View Order
                </a>
              )}
              <button
                onClick={() => setOrderSuccessDialog({ isOpen: false, orderId: null, isSuccess: false, message: '' })}
                style={{
                  padding: '12px 24px',
                  backgroundColor: orderSuccessDialog.isSuccess ? '#6b7280' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (orderSuccessDialog.isSuccess) {
                    e.currentTarget.style.backgroundColor = '#4b5563'
                  } else {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (orderSuccessDialog.isSuccess) {
                    e.currentTarget.style.backgroundColor = '#6b7280'
                  } else {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                  }
                }}
              >
                {orderSuccessDialog.isSuccess ? 'Continue' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for loading spinner and body reset */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes shakeX {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-10px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(10px);
          }
        }
        
        /* Reset body/html to prevent scrolling in POS */
        body, html {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          height: 100vh !important;
        }
        
        /* POS Container - Simple fixed padding */
        .pos-main-container {
          margin-left: 220px; /* Standard Medusa sidebar width */
        }
        /* POS content positioned to not overlap admin UI elements */
      `}</style>
    </>
  )
}

export default POSPage

export const config = defineRouteConfig({
  label: "Point of Sale",
  icon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
  )
})
