import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { INVOICE_MODULE } from "../../modules/invoice-generator"

type StepInput = {
  id?: string
  company_name?: string
  company_address?: string
  company_phone?: string
  company_email?: string
  company_logo?: string
  notes?: string
}

export const updateInvoiceConfigStep = createStep(
  "update-invoice-config",
  async (input: StepInput = {}, { container }) => {
    const invoiceGeneratorService = container.resolve(INVOICE_MODULE)

    const { id, ...updateData } = input || {}

    const existing = await invoiceGeneratorService.listInvoiceConfigs()
    const prevData = id
      ? await invoiceGeneratorService.retrieveInvoiceConfig(id)
      : (Array.isArray(existing) && existing.length
          ? existing.reduce((a: any, b: any) => {
              const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
              const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
              return bTime > aTime ? b : a
            })
          : undefined)

    let updatedData
    if (prevData?.id) {
      updatedData = await invoiceGeneratorService.updateInvoiceConfigs({
        id: prevData.id,
        ...updateData,
      })
    } else {
      updatedData = await invoiceGeneratorService.createInvoiceConfigs({
        ...updateData,
      })
    }

    return new StepResponse(updatedData, prevData)
  },
  async (prevInvoiceConfig, { container }) => {
    if (!prevInvoiceConfig) {
      return
    }

    const invoiceGeneratorService = container.resolve(INVOICE_MODULE)

    await invoiceGeneratorService.updateInvoiceConfigs({
      id: prevInvoiceConfig.id,
      company_name: prevInvoiceConfig.company_name,
      company_address: prevInvoiceConfig.company_address,
      company_phone: prevInvoiceConfig.company_phone,
      company_email: prevInvoiceConfig.company_email,
      company_logo: prevInvoiceConfig.company_logo,
      notes: prevInvoiceConfig.notes,
    })
  }
)