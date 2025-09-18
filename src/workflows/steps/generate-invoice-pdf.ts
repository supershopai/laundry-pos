import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_MODULE } from "../../modules/invoice-generator"
import { OrderDTO, OrderLineItemDTO } from "@medusajs/framework/types"

export type GenerateInvoicePdfStepInput = {
  order: OrderDTO
  items: OrderLineItemDTO[]
  invoice_id: string
}

export const generateInvoicePdfStep = createStep(
  "generate-invoice-pdf",
  async (input: GenerateInvoicePdfStepInput, { container }) => {
    const invoiceGeneratorService = container.resolve(INVOICE_MODULE)

    const previousInv = await invoiceGeneratorService.retrieveInvoice(
      input.invoice_id
    )

    const pdfBuffer = await invoiceGeneratorService.generatePdf({
      order: input.order,
      items: input.items,
      invoice_id: input.invoice_id,
    })

    return new StepResponse({
      pdf_buffer: pdfBuffer,
    }, previousInv)
  },
  async (previousInv, { container }) => {
    if (!previousInv) {
      return
    }

    const invoiceGeneratorService = container.resolve(INVOICE_MODULE)

    await invoiceGeneratorService.updateInvoices({
      id: previousInv.id,
      pdfContent: previousInv.pdfContent,
    })
  }
)

export type GenerateThermalOrderPdfStepInput = {
  order: OrderDTO
  items: OrderLineItemDTO[]
}

export const generateThermalOrderPdfStep = createStep(
  "generate-thermal-order-pdf",
  async (input: GenerateThermalOrderPdfStepInput, { container }) => {
    const svc = container.resolve(INVOICE_MODULE)
    const pdf = await svc.generateThermalOrderPdf({ order: input.order, items: input.items })
    return new StepResponse({ pdf_buffer: pdf })
  }
)

export type GenerateGarmentTokenPdfStepInput = {
  order: OrderDTO
}

export const generateGarmentTokenPdfStep = createStep(
  "generate-garment-token-pdf",
  async (input: GenerateGarmentTokenPdfStepInput, { container }) => {
    const svc = container.resolve(INVOICE_MODULE)
    const pdf = await svc.generateGarmentTokenPdf({ order: input.order })
    return new StepResponse({ pdf_buffer: pdf })
  }
)