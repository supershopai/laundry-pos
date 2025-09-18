import React from 'react'

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

interface ProductsProps {
  products: Product[]
  categories: ProductCategory[]
  selectedCategory: string
  productSearch: string
  dataLoading: boolean
  onCategorySelect: (categoryId: string) => void
  onProductSearch: (search: string) => void
  onProductClick: (product: Product) => void
  onAddToCart: (product: Product, variant: ProductVariant) => void
}

// Category icons
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase()
  if (name.includes('men') || name.includes('shirt') || name.includes('clothing')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2A2,2 0 0,1 14,4C14,5.24 13.41,6.34 12.5,7.1L15,9.5V11H9V9.5L11.5,7.1C10.59,6.34 10,5.24 10,4A2,2 0 0,1 12,2M21,9V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V9H21Z"/>
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
    </svg>
  )
}

export const Products: React.FC<ProductsProps> = ({
  products,
  categories,
  selectedCategory,
  productSearch,
  dataLoading,
  onCategorySelect,
  onProductSearch,
  onProductClick,
  onAddToCart
}) => {
  // Group products by type
  const groupedProducts = products.reduce((groups, product) => {
    const typeKey = product.type?.value || 'Other'
    if (!groups[typeKey]) {
      groups[typeKey] = []
    }
    groups[typeKey].push(product)
    return groups
  }, {} as Record<string, Product[]>)


  return (
    <div style={{
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 24px'
    }}>
      {/* Search Bar */}
      <div style={{
        padding: '16px 0',
        borderBottom: '1px solid var(--ui-border-base)',
        backgroundColor: 'var(--ui-bg-base)'
      }}>
        <div style={{
          position: 'relative',
          width: '100%'
        }}>
          <input
            type="text"
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => onProductSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              border: '1px solid var(--ui-border-base)',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: 'var(--ui-bg-field)',
              color: 'var(--ui-fg-base)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12), 0 0 0 3px rgba(59, 130, 246, 0.1)'
              e.currentTarget.style.borderColor = 'var(--ui-border-interactive)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)'
              e.currentTarget.style.borderColor = 'var(--ui-border-base)'
            }}
          />
          <svg 
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ui-fg-muted)'
            }}
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
          </svg>
        </div>
      </div>

      {/* Category Filters */}
      <div style={{
        padding: '16px 0',
        borderBottom: '1px solid var(--ui-border-base)',
        backgroundColor: 'var(--ui-bg-subtle)'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => onCategorySelect("all")}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '600',
              border: `2px solid ${selectedCategory === "all" ? 'var(--ui-bg-interactive)' : 'var(--ui-border-base)'}`,
              borderRadius: '25px',
              cursor: 'pointer',
              backgroundColor: selectedCategory === "all" ? 'var(--ui-bg-interactive)' : 'var(--ui-bg-base)',
              color: selectedCategory === "all" ? 'var(--ui-fg-on-inverted)' : 'var(--ui-fg-base)',
              transition: 'all 0.3s ease',
              boxShadow: selectedCategory === "all" ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
              transform: selectedCategory === "all" ? 'translateY(-1px)' : 'translateY(0)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>
            </svg>
            All Categories
          </button>
{categories.map(category => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              style={{
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: '600',
                border: `2px solid ${selectedCategory === category.id ? 'var(--ui-bg-interactive)' : 'var(--ui-border-base)'}`,
                borderRadius: '25px',
                cursor: 'pointer',
                backgroundColor: selectedCategory === category.id ? 'var(--ui-bg-interactive)' : 'var(--ui-bg-base)',
                color: selectedCategory === category.id ? 'var(--ui-fg-on-inverted)' : 'var(--ui-fg-base)',
                transition: 'all 0.3s ease',
                boxShadow: selectedCategory === category.id ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
                transform: selectedCategory === category.id ? 'translateY(-1px)' : 'translateY(0)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.borderColor = 'var(--ui-border-interactive)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.borderColor = 'var(--ui-border-base)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
                }
              }}
            >
              {getCategoryIcon(category.name || 'Default')}
              {category.name || 'Unnamed Category'}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid - Scrollable */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px 0'
      }}>
        {dataLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            fontSize: '14px',
            color: 'var(--ui-fg-muted)'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid var(--ui-border-base)',
              borderTop: '3px solid var(--ui-bg-interactive)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: '12px'
            }}></div>
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--ui-fg-muted)',
            fontSize: '14px',
            padding: '40px 20px'
          }}>
            No products found
          </div>
        ) : products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--ui-fg-muted)',
            fontSize: '14px',
            padding: '40px 20px'
          }}>
            No products available - products array is empty
          </div>
        ) : Object.keys(groupedProducts).length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--ui-fg-muted)',
            fontSize: '14px',
            padding: '40px 20px'
          }}>
            No products available after grouping - Check product.type values
          </div>
        ) : (
          Object.entries(groupedProducts).map(([type, typeProducts]) => (
            <div key={type} style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--ui-fg-base)',
                marginBottom: '16px',
                borderBottom: '1px solid var(--ui-border-base)',
                paddingBottom: '12px',
                margin: '0 0 16px 0'
              }}>
                {type} ({typeProducts.length} products)
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: '16px'
              }}>
                {typeProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    style={{
                      border: '1px solid var(--ui-border-base)',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      backgroundColor: 'var(--ui-bg-base)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
                      transform: 'translateY(0)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ui-border-interactive)'
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ui-border-base)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    {(product.thumbnail || (product.images && product.images.length > 0)) && (
                      <img
                        src={product.thumbnail || product.images?.[0]?.url}
                        alt={product.title}
                        style={{
                          width: '100%',
                          height: '60px',
                          objectFit: 'contain',
                          backgroundColor: 'var(--ui-bg-subtle)',
                          borderRadius: '4px',
                          marginBottom: '8px'
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--ui-fg-base)',
                      margin: '0 0 4px 0',
                      textAlign: 'center'
                    }}>
                      {product.title}
                    </h4>
                    {product.description && (
                      <p style={{
                        fontSize: '12px',
                        color: 'var(--ui-fg-muted)',
                        margin: '0 0 8px 0',
                        lineHeight: '1.4',
                        textAlign: 'center'
                      }}>
                        {product.description.substring(0, 60)}...
                      </p>
                    )}
                    {product.variants && product.variants.length === 1 ? (
                      <div style={{ marginTop: '10px' }}>
                        {product.variants[0].prices && product.variants[0].prices.length > 0 && (
                          <div style={{
                            fontSize: '14px',
                            color: 'var(--ui-fg-interactive)',
                            fontWeight: '600',
                            marginBottom: '8px',
                            textAlign: 'center'
                          }}>
                            {product.variants[0].prices[0].currency_code.toUpperCase()} {product.variants[0].prices[0].amount.toFixed(2)}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (product.variants[0].prices && product.variants[0].prices.length > 0) {
                              onAddToCart(product, product.variants[0])
                            }
                          }}
                          disabled={!product.variants[0].prices || product.variants[0].prices.length === 0}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            backgroundColor: product.variants[0].prices && product.variants[0].prices.length > 0 ? 'var(--ui-bg-interactive)' : 'var(--ui-bg-disabled)',
                            color: 'var(--ui-fg-on-inverted)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: product.variants[0].prices && product.variants[0].prices.length > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '14px',
                            fontWeight: '600',
                            boxShadow: product.variants[0].prices && product.variants[0].prices.length > 0 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s ease',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    ) : product.variants && product.variants.length > 1 ? (
                      <div style={{
                        marginTop: '10px',
                        fontSize: '12px',
                        color: 'var(--ui-fg-muted)',
                        fontWeight: '500',
                        textAlign: 'center'
                      }}>
                        {product.variants.length} variants - click to select
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
