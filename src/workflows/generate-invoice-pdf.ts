import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { generateInvoicePdfStep, GenerateInvoicePdfStepInput, generateThermalOrderPdfStep, generateGarmentTokenPdfStep } from "./steps/generate-invoice-pdf"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { getOrderInvoiceStep } from "./steps/get-order-invoice"

type WorkflowInput = {
  order_id: string
}

export const generateInvoicePdfWorkflow = createWorkflow(
  "generate-invoice-pdf",
  (input: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "created_at",
        "currency_code",
        "total",
        "items.*",
        "items.variant.*",
        "items.variant.product.*",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "tax_total",
        "subtotal",
        "discount_total",
      ],
      filters: {
        id: input.order_id,
      },
      options: {
        throwIfKeyNotFound: true,
      },
    })
    const countryFilters = transform({
      orders,
    }, (data) => {
      const country_codes: string[] = []
      if (data.orders[0].billing_address?.country_code) {
        country_codes.push(data.orders[0].billing_address.country_code)
      }
      if (data.orders[0].shipping_address?.country_code) {
        country_codes.push(data.orders[0].shipping_address.country_code)
      }
      return country_codes
    })
    const { data: countries } = useQueryGraphStep({
      entity: "country",
      fields: ["display_name", "iso_2"],
      filters: {
        iso_2: countryFilters,
      },
    }).config({ name: "retrieve-countries" })

    const transformedOrder = transform({
      orders,
      countries,
    }, (data) => {
      const order = data.orders[0]
      
      if (order.billing_address?.country_code) {
        order.billing_address.country_code = data.countries.find(
          (country) => country.iso_2 === order.billing_address!.country_code
        )?.display_name || order.billing_address!.country_code
      }
      
      if (order.shipping_address?.country_code) {
        order.shipping_address.country_code = data.countries.find(
          (country) => country.iso_2 === order.shipping_address!.country_code
        )?.display_name || order.shipping_address!.country_code
      }

      return order
    })

    const invoice = getOrderInvoiceStep({
      order_id: transformedOrder.id,
    })

    const { pdf_buffer } = generateInvoicePdfStep({
      order: transformedOrder,
      items: transformedOrder.items,
      invoice_id: invoice.id,
    } as unknown as GenerateInvoicePdfStepInput)

    return new WorkflowResponse({
      pdf_buffer,
    })
  }
)

export const generateThermalOrderPdfWorkflow = createWorkflow(
  "generate-thermal-order-pdf",
  (input: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "*", 
        "items.*", 
        "items.variant.*", 
        "items.variant.product.*",
        "items.adjustments.*",
        "subtotal",
        "discount_total", 
        "tax_total",
        "total",
        "shipping_methods.*"
      ],
      filters: { id: input.order_id },
      options: { throwIfKeyNotFound: true },
    })

    const order = transform({ orders }, (data) => data.orders[0] as any)
    const { pdf_buffer } = generateThermalOrderPdfStep({ order: order as any, items: (order as any).items as any })

    return new WorkflowResponse({ pdf_buffer })
  }
)

export const generateGarmentTokenPdfWorkflow = createWorkflow(
  "generate-garment-token-pdf",
  (input: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "*",
        "items.*",
        "customer.*",
        "billing_address.*",
        "shipping_address.*",
      ],
      filters: { id: input.order_id },
      options: { throwIfKeyNotFound: true },
    })

    const order = transform({ orders }, (data) => data.orders[0] as any)
    const { pdf_buffer } = generateGarmentTokenPdfStep({ order: order as any })

    return new WorkflowResponse({ pdf_buffer })
  }
)