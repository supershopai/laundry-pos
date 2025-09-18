import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log("POS Data API - Using Admin API for all data...")
    console.log('User in data request:', (req as any).user ? `${(req as any).user.id}` : 'None')
    
    const baseUrl = `${req.protocol}://${req.get('host')}`
    const headers = {
      'Cookie': req.headers.cookie || '',
      'Authorization': req.headers.authorization || ''
    }

    // Fetch all data using Admin API - try different approaches to get categories
    const [productsResponse, categoriesResponse, customersResponse] = await Promise.all([
      fetch(`${baseUrl}/admin/products?limit=100&fields=*categories`, { headers }),
      fetch(`${baseUrl}/admin/product-categories?limit=100`, { headers }),
      fetch(`${baseUrl}/admin/customers?limit=100`, { headers })
    ])

    console.log(`API Status: Products=${productsResponse.status}, Categories=${categoriesResponse.status}, Customers=${customersResponse.status}`)

    // Parse responses
    const [productsData, categoriesData, customersData] = await Promise.all([
      productsResponse.ok ? productsResponse.json() : { products: [] },
      categoriesResponse.ok ? categoriesResponse.json() : { product_categories: [] },
      customersResponse.ok ? customersResponse.json() : { customers: [] }
    ])

    const products = productsData.products || []
    const categories = categoriesData.product_categories || []
    const customers = customersData.customers || []

    console.log(`Fetched: ${products.length} products, ${categories.length} categories, ${customers.length} customers`)
    
    // Debug categories structure
    if (categories.length > 0) {
      console.log('First category structure:', JSON.stringify(categories[0], null, 2))
      categories.forEach((category, index) => {
        console.log(`Category ${index + 1} (${category.name || 'Unnamed'}): ID ${category.id}`)
      })
    } else {
      console.log('Warning: No categories found in API response')
    }

    // Debug: Log first product structure  
    if (products.length > 0) {
      console.log('Admin API Product structure:', JSON.stringify(products[0], null, 2))
      console.log('First product categories:', products[0].categories)
      
      // Log all products and their categories
      products.forEach((product, index) => {
        console.log(`Product ${index + 1} (${product.title}):`, product.categories?.map(c => `${c.id}:${c.name}`) || 'No categories')
      })
    }

    // Since expand/fields might not work, let's manually associate products with categories
    console.log('Manually associating products with categories...')
    
    const processedProducts = await Promise.all(
      products.map(async (product) => {
        try {
          // Try to fetch individual product with categories
          const productDetailResponse = await fetch(`${baseUrl}/admin/products/${product.id}?fields=*categories`, { headers })
          if (productDetailResponse.ok) {
            const productDetail = await productDetailResponse.json()
            if (productDetail.product && productDetail.product.categories) {
              product.categories = productDetail.product.categories
              console.log(`Loaded categories for ${product.title}:`, productDetail.product.categories.map(c => c.name))
            }
          }
        } catch (error) {
          console.log(`Failed to fetch categories for ${product.title}:`, error.message)
        }
        
        // Fallback: try to find categories that might reference this product
        if (!product.categories || product.categories.length === 0) {
          const associatedCategories = categories.filter(category => 
            category.products?.some(p => p.id === product.id)
          )
          if (associatedCategories.length > 0) {
            product.categories = associatedCategories.map(cat => ({
              id: cat.id,
              name: cat.name,
              handle: cat.handle,
              description: cat.description
            }))
            console.log(`Fallback association for ${product.title}:`, product.categories.map(c => c.name))
          }
        }
        
        return product
      })
    )

    // Format categories
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      handle: category.handle
    }))

    // Format customers
    const formattedCustomers = customers.map(customer => ({
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone
    }))

    const totalVariants = processedProducts.reduce((sum, product) => sum + (product.variants?.length || 0), 0)
    console.log(`Final: ${processedProducts.length} products, ${totalVariants} variants, ${formattedCategories.length} categories, ${formattedCustomers.length} customers`)
    
    // Debug: Count products per category
    formattedCategories.forEach(category => {
      const productCount = processedProducts.filter(product => 
        product.categories?.some(c => c.id === category.id)
      ).length
      console.log(`API - Category "${category.name}" (${category.id}): ${productCount} products`)
    })

    res.json({
      products: processedProducts,
      categories: formattedCategories,
      customers: formattedCustomers,
      counts: {
        products: processedProducts.length,
        categories: formattedCategories.length,
        customers: formattedCustomers.length,
        variants: totalVariants
      }
    })

  } catch (error) {
    console.error('POS Data API Error:', error)
    res.status(500).json({ 
      error: error.message,
      products: [],
      categories: [],
      customers: [],
      counts: { products: 0, categories: 0, customers: 0, variants: 0 }
    })
  }
}
