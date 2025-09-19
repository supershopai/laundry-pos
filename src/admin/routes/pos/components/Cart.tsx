import React, { useEffect, useRef, useState } from 'react'
import { Cart as CartInterface, Customer } from '../page'

interface CartProps {
  cart: CartInterface | null
  customers: Customer[]
  selectedCustomer: Customer | null
  discountCode: string
  discountMessage: {
    type: 'success' | 'error' | null
    text: string
  }
  customerSearch: string
  dataLoading: boolean
  formatPrice: (amount: number, currency?: string) => string
  onCustomerSearch: (searchTerm: string) => void
  onCustomerSelect: (customer: Customer) => void
  onUpdateQuantity: (variantId: string, quantity: number) => void
  onRemoveFromCart: (variantId: string) => void
  onDiscountCodeChange: (code: string) => void
  onApplyDiscount: () => void
  onRemoveDiscount: () => void
  onCompleteOrder: (paymentMethod: string) => void
}

export const Cart: React.FC<CartProps> = ({
  cart,
  customers,
  selectedCustomer,
  discountCode,
  discountMessage,
  customerSearch,
  dataLoading,
  formatPrice,
  onCustomerSearch,
  onCustomerSelect,
  onUpdateQuantity,
  onRemoveFromCart,
  onDiscountCodeChange,
  onApplyDiscount,
  onRemoveDiscount,
  onCompleteOrder
}) => {
  const cartItemsRef = useRef<HTMLDivElement>(null)
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false)
  const [isCustomerSearchFocused, setIsCustomerSearchFocused] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  })
  const [isCustomerValidationOpen, setIsCustomerValidationOpen] = useState(false)

  // Handle payment click with customer validation
  const handlePaymentClick = (paymentMethod: string) => {
    if (!selectedCustomer) {
      setIsCustomerValidationOpen(true)
    } else {
      onCompleteOrder(paymentMethod)
    }
  }


  // Auto-scroll to bottom when cart items change
  useEffect(() => {
    if (cartItemsRef.current && cart?.items?.length) {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        if (cartItemsRef.current) {
          cartItemsRef.current.scrollTo({
            top: cartItemsRef.current.scrollHeight,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }, [cart?.items?.length])

  // Handle new customer form submission
  const handleCreateCustomer = async () => {
    try {
      // Basic validation
      if (!newCustomerForm.email || !newCustomerForm.first_name || !newCustomerForm.last_name) {
        alert('Please fill in all required fields')
        return
      }

      // TODO: Replace with actual API call to create customer
      console.log('Creating new customer:', newCustomerForm)
      
      // For now, just close the dialog and reset form
      setIsNewCustomerDialogOpen(false)
      setNewCustomerForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
      })
      
      alert('Customer creation functionality will be implemented with backend integration')
    } catch (error) {
      console.error('Failed to create customer:', error)
      alert('Failed to create customer')
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setNewCustomerForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div style={{
      width: '400px',
      borderLeft: '1px solid var(--ui-border-base)',
      backgroundColor: 'var(--ui-bg-base)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--ui-border-base)',
        backgroundColor: 'var(--ui-bg-base)'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--ui-fg-base)'
        }}>
          Shopping Cart
        </h3>
      </div>

      {/* Customer Section - Compact */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--ui-border-base)',
        backgroundColor: 'var(--ui-bg-subtle)'
      }}>
        {selectedCustomer ? (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ui-fg-muted)' }}>
                {selectedCustomer.email}
              </div>
            </div>
            <button
              onClick={() => onCustomerSelect(null as any)}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: 'transparent',
                border: '1px solid var(--ui-border-base)',
                borderRadius: '4px',
                cursor: 'pointer',
                color: 'var(--ui-fg-muted)'
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearch}
                onChange={(e) => onCustomerSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid var(--ui-border-base)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'var(--ui-bg-field)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12), 0 0 0 3px rgba(59, 130, 246, 0.1)'
                  e.currentTarget.style.borderColor = 'var(--ui-border-interactive)'
                  setIsCustomerSearchFocused(true)
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)'
                  e.currentTarget.style.borderColor = 'var(--ui-border-base)'
                  // Delay hiding the dropdown to allow for clicks on customer items
                  setTimeout(() => setIsCustomerSearchFocused(false), 150)
                }}
              />
              <button
                onClick={() => setIsNewCustomerDialogOpen(true)}
                title="Add New Customer"
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: 'var(--ui-bg-interactive)',
                  color: 'var(--ui-fg-on-inverted)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--ui-bg-interactive-hover)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--ui-bg-interactive)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                </svg>
              </button>
            </div>
            {(customerSearch || isCustomerSearchFocused) && customers.length > 0 && (
              <div style={{
                maxHeight: '160px',
                overflowY: 'auto',
                border: '1px solid var(--ui-border-base)',
                borderRadius: '4px',
                backgroundColor: 'var(--ui-bg-base)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                {!customerSearch && (
                  <div style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'var(--ui-fg-muted)',
                    backgroundColor: 'var(--ui-bg-subtle)',
                    borderBottom: '1px solid var(--ui-border-base)'
                  }}>
                    All Customers ({customers.length})
                  </div>
                )}
                {(customerSearch ? customers.slice(0, 3) : customers.slice(0, 5)).map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => onCustomerSelect(customer)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--ui-border-base)',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--ui-bg-subtle)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--ui-bg-base)'
                    }}
                  >
                    <div style={{ fontWeight: '500' }}>
                      {customer.first_name} {customer.last_name}
                    </div>
                    <div style={{ color: 'var(--ui-fg-muted)', fontSize: '12px' }}>
                      {customer.email}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Items - Scrollable Middle Section */}
      <div 
        ref={cartItemsRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0'
        }}>
        {!cart || !cart.items || cart.items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--ui-fg-muted)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
              Cart is empty
            </div>
            <div style={{ fontSize: '14px' }}>
              Add products to get started
            </div>
          </div>
        ) : (
          <div>
            {cart.items?.map((item: any, index: number) => (
              <div
                key={`${item.variant_id}-${index}`}
                style={{
                  padding: '16px',
                  margin: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--ui-bg-base)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)',
                  border: '1px solid var(--ui-border-base)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ flex: 1, paddingRight: '12px' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      marginBottom: '4px',
                      lineHeight: '1.3'
                    }}>
                      {item.title}
                    </div>
                    {item.variant_title && (
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--ui-fg-muted)',
                        marginBottom: '4px'
                      }}>
                        {item.variant_title}
                      </div>
                    )}
                    {item.sku && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--ui-fg-muted)',
                        fontFamily: 'monospace'
                      }}>
                        {item.sku}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveFromCart(item.variant_id)}
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--ui-border-base)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: 'var(--ui-fg-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--ui-bg-danger)'
                      e.currentTarget.style.color = 'var(--ui-fg-on-inverted)'
                      e.currentTarget.style.borderColor = 'var(--ui-bg-danger)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = 'var(--ui-fg-muted)'
                      e.currentTarget.style.borderColor = 'var(--ui-border-base)'
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => onUpdateQuantity(item.variant_id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: 'var(--ui-bg-base)',
                        border: '1px solid var(--ui-border-base)',
                        borderRadius: '4px',
                        cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: item.quantity <= 1 ? 'var(--ui-fg-disabled)' : 'var(--ui-fg-base)'
                      }}
                      onMouseEnter={(e) => {
                        if (item.quantity > 1) {
                          e.currentTarget.style.backgroundColor = 'var(--ui-bg-subtle)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (item.quantity > 1) {
                          e.currentTarget.style.backgroundColor = 'var(--ui-bg-base)'
                        }
                      }}
                    >
                      −
                    </button>
                    <span style={{
                      minWidth: '24px',
                      textAlign: 'center',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.variant_id, item.quantity + 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: 'var(--ui-bg-base)',
                        border: '1px solid var(--ui-border-base)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--ui-fg-base)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--ui-bg-subtle)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--ui-bg-base)'
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--ui-fg-base)'
                    }}>
                      {formatPrice(item.unit_price * item.quantity, item.currency_code)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--ui-fg-muted)'
                    }}>
                      {formatPrice(item.unit_price, item.currency_code)} each
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals & Actions - Compact Bottom Section */}
      {cart && cart.items && cart.items.length > 0 && (
        <div style={{
          backgroundColor: 'var(--ui-bg-base)',
          paddingBottom: '8px'
        }}>
          {/* Discount Message */}
          {discountMessage.type && (
            <div style={{
              margin: '8px 12px 4px 12px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: discountMessage.type === 'success' ? '#dcfce7' : '#fef2f2',
              color: discountMessage.type === 'success' ? '#16a34a' : '#dc2626',
              border: `1px solid ${discountMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>
                {discountMessage.type === 'success' ? '✓' : '✗'}
              </span>
              <span>{discountMessage.text}</span>
            </div>
          )}

          {/* Discount Section */}
          <div style={{ 
            padding: '12px 16px', 
            margin: '8px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--ui-bg-subtle)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)',
            border: '1px solid var(--ui-border-base)'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder={cart && cart.discount_total > 0 ? "Discount applied" : "Discount code"}
                value={discountCode}
                onChange={(e) => onDiscountCodeChange(e.target.value)}
                disabled={cart && cart.discount_total > 0}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid var(--ui-border-base)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: cart && cart.discount_total > 0 ? 'var(--ui-bg-disabled)' : 'var(--ui-bg-field)',
                  color: cart && cart.discount_total > 0 ? 'var(--ui-fg-muted)' : 'var(--ui-fg-base)',
                  cursor: cart && cart.discount_total > 0 ? 'not-allowed' : 'text'
                }}
              />
              {cart && cart.discount_total > 0 ? (
                <button
                  onClick={onRemoveDiscount}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={onApplyDiscount}
                  disabled={!discountCode.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: discountCode.trim() ? 'var(--ui-bg-interactive)' : 'var(--ui-bg-disabled)',
                    color: 'var(--ui-fg-on-inverted)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: discountCode.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Apply
                </button>
              )}
            </div>
          </div>

          {/* Totals */}
          <div style={{ 
            padding: '16px',
            margin: '8px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--ui-bg-base)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)',
            border: '1px solid var(--ui-border-base)'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '14px'
              }}>
                <span>Subtotal:</span>
                <span>{formatPrice(cart?.subtotal || 0, cart?.currency_code || cart?.items?.[0]?.currency_code || 'INR')}</span>
              </div>
              {cart && cart.discount_total > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                  fontSize: '14px',
                  color: 'var(--ui-fg-success)'
                }}>
                  <span>Discount:</span>
                  <span>-{formatPrice(cart.discount_total || 0, cart?.currency_code || cart?.items?.[0]?.currency_code || 'INR')}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '14px'
              }}>
                <span>Tax:</span>
                <span>{formatPrice(cart?.tax_total || 0, cart?.currency_code || cart?.items?.[0]?.currency_code || 'INR')}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: '700',
                paddingTop: '8px',
                borderTop: '1px solid var(--ui-border-base)',
                color: 'var(--ui-fg-base)'
              }}>
                <span>Total:</span>
                <span>{formatPrice(cart?.total || 0, cart?.currency_code || cart?.items?.[0]?.currency_code || 'INR')}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => handlePaymentClick('cash')}
                disabled={dataLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: dataLoading ? 'var(--ui-bg-disabled)' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: dataLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!dataLoading) {
                    e.currentTarget.style.backgroundColor = '#059669'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!dataLoading) {
                    e.currentTarget.style.backgroundColor = '#10b981'
                  }
                }}
              >
                {dataLoading ? 'Processing...' : 'Pay with Cash'}
              </button>
              <button
                onClick={() => handlePaymentClick('card')}
                disabled={dataLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: dataLoading ? 'var(--ui-bg-disabled)' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: dataLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!dataLoading) {
                    e.currentTarget.style.backgroundColor = '#2563eb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!dataLoading) {
                    e.currentTarget.style.backgroundColor = '#3b82f6'
                  }
                }}
              >
                {dataLoading ? 'Processing...' : 'Pay with Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Customer Dialog */}
      {isNewCustomerDialogOpen && (
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
          onClick={() => setIsNewCustomerDialogOpen(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
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
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Add New Customer
              </h3>
              <button
                onClick={() => setIsNewCustomerDialogOpen(false)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.first_name}
                    onChange={(e) => handleFormChange('first_name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb'
                    }}
                    placeholder="Enter first name"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '6px', 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.last_name}
                    onChange={(e) => handleFormChange('last_name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: '#f9fafb'
                    }}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb'
                  }}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '6px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newCustomerForm.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb'
                  }}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginTop: '24px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setIsNewCustomerDialogOpen(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Create Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Validation Dialog */}
      {isCustomerValidationOpen && (
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
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
              </div>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Customer Required
              </h3>
            </div>

            <p style={{
              margin: '0 0 20px 0',
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              Please select a customer before completing the order. You can select an existing customer from the list above or create a new customer.
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => {
                  setIsCustomerValidationOpen(false)
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}