import React, { useCallback, useState } from "react"
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay"
import { Cart as CartInterface } from '../page'

interface RazorpayPaymentButtonProps {
  cart: CartInterface | null
  selectedCustomer: any
  onPaymentSuccess: (orderId: string) => void
  onPaymentError: (error: string) => void
  disabled?: boolean
}

export const RazorpayPaymentButton: React.FC<RazorpayPaymentButtonProps> = ({
  cart,
  selectedCustomer,
  onPaymentSuccess,
  onPaymentError,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { Razorpay, isLoading: razorpayLoading } = useRazorpay()

  // Razorpay configuration - using hardcoded values for now
  const razorpayKey = 'rzp_test_RJL4LYePrxeaiR'
  const shopName = 'Laundry POS'
  const shopDescription = 'Professional Laundry Services'

  const handlePayment = useCallback(async () => {
    if (!cart || !selectedCustomer || razorpayLoading) {
      setError('Cart, customer, or Razorpay not ready')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create payment session with Razorpay
      const response = await fetch('/admin/pos/cart-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          operation: 'create_payment_session',
          cart_id: cart.id,
          payment_provider: 'razorpay'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment session')
      }

      const paymentData = await response.json()
      
      if (!paymentData.payment_session) {
        throw new Error('No payment session created')
      }

      // Prepare Razorpay options
      const options: RazorpayOrderOptions = {
        key: razorpayKey,
        amount: Math.round(cart.total * 100), // Convert to paise
        currency: cart.currency_code?.toUpperCase() as any,
        name: shopName,
        description: `${shopDescription} - Order for ${selectedCustomer.first_name || selectedCustomer.email}`,
        order_id: paymentData.payment_session.data.razorpay_order_id,
        prefill: {
          name: `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim(),
          email: selectedCustomer.email,
          contact: selectedCustomer.phone || ''
        },
        notes: JSON.stringify({
          cart_id: cart.id,
          customer_id: selectedCustomer.id
        }),
        theme: {
          color: '#3b82f6'
        },
        handler: async (response) => {
          try {
            console.log('✅ Payment successful:', response)
            console.log('🔍 Payment response details:', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              has_payment_id: !!response.razorpay_payment_id,
              has_order_id: !!response.razorpay_order_id,
              has_signature: !!response.razorpay_signature
            })
            
            // Verify payment with backend
            const requestBody = {
              operation: 'verify_payment',
              cart_id: cart.id,
              data: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              }
            }
            
            console.log('📤 Sending verification request:', JSON.stringify(requestBody, null, 2))
            
            const verifyResponse = await fetch('/admin/pos/cart-operations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(requestBody)
            })

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json()
              console.log('✅ Payment verified successfully:', verifyData)
              
              if (verifyData.success) {
                onPaymentSuccess(verifyData.order_id)
              } else {
                throw new Error(verifyData.error || 'Payment verification failed')
              }
            } else {
              const errorData = await verifyResponse.json()
              throw new Error(errorData.error || 'Payment verification failed')
            }
          } catch (error) {
            console.error('❌ Payment verification error:', error)
            onPaymentError(error instanceof Error ? error.message : 'Payment verification failed')
          }
        },
        modal: {
          ondismiss: () => {
            console.log('❌ Payment modal dismissed by user')
            setIsProcessing(false)
            onPaymentError('Payment cancelled by user')
          }
        }
      }

      // Open Razorpay modal
      const razorpayInstance = new Razorpay(options)
      razorpayInstance.open()

    } catch (error) {
      console.error('Payment error:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
      onPaymentError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }, [cart, selectedCustomer, razorpayLoading, razorpayKey, onPaymentSuccess, onPaymentError])

  if (razorpayLoading) {
    return (
      <button
        disabled
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: '#e5e7eb',
          color: '#6b7280',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'not-allowed'
        }}
      >
        Loading Razorpay...
      </button>
    )
  }

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={disabled || isProcessing || !cart || !selectedCustomer}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: disabled || !cart || !selectedCustomer ? '#e5e7eb' : '#3b82f6',
          color: disabled || !cart || !selectedCustomer ? '#6b7280' : 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: disabled || !cart || !selectedCustomer ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {isProcessing ? 'Processing...' : 'Pay with Card (Razorpay)'}
      </button>
      
      {error && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
