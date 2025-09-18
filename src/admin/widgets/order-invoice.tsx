import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { sdk } from "../lib/sdk"
import { useState } from "react"

const OrderInvoiceWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
        const [isDownloading, setIsDownloading] = useState(false)
      
        const downloadInvoice = async () => {
          setIsDownloading(true)
          
          try {
            const response: Response = await sdk.client.fetch(
              `/admin/orders/${order.id}/invoices`, 
              {
                method: "GET",
                headers: {
                  "accept": "application/pdf",
                },
              }
            )
        
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `invoice-${order.id}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            setIsDownloading(false)
            toast.success("Invoice generated and downloaded successfully")
          } catch (error) {
            toast.error(`Failed to generate invoice: ${error}`)
            setIsDownloading(false)
          }
        }
      
        return (
          <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <Heading level="h2">Invoice</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  Generate and download invoice for this order
                </Text>
              </div>
            </div>
      
            <div className="flex items-center justify-end px-6 py-4 gap-2">
              <Button
                variant="secondary"
                disabled={isDownloading}
                onClick={downloadInvoice}
                isLoading={isDownloading}
              >
                Download Invoice
              </Button>
              <Button
                variant="secondary"
                disabled={isDownloading}
                onClick={async () => {
                  setIsDownloading(true)
                  try {
                    const res: Response = await sdk.client.fetch(`/admin/orders/${order.id}/invoices?kind=thermal`, {
                      method: "PUT",
                      headers: { "accept": "application/pdf" },
                    })
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `order-${order.id}-thermal.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    toast.success("Thermal order PDF generated")
                  } catch (e) {
                    toast.error(`Failed to print order: ${e}`)
                  } finally {
                    setIsDownloading(false)
                  }
                }}
              >
                Print Order
              </Button>
              <Button
                variant="secondary"
                disabled={isDownloading}
                onClick={async () => {
                  setIsDownloading(true)
                  try {
                    const res: Response = await sdk.client.fetch(`/admin/orders/${order.id}/invoices?kind=garment`, {
                      method: "PUT",
                      headers: { "accept": "application/pdf" },
                    })
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `order-${order.id}-garment.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    toast.success("Garment token generated")
                  } catch (e) {
                    toast.error(`Failed to print garment: ${e}`)
                  } finally {
                    setIsDownloading(false)
                  }
                }}
              >
                Print Garment
              </Button>
            </div>
          </Container>
        )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderInvoiceWidget