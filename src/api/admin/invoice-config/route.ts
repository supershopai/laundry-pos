import { z } from "zod"
import { 
  updateInvoiceConfigWorkflow,
} from "../../../workflows/update-invoice-config"
import { INVOICE_MODULE } from "../../../modules/invoice-generator"

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const svc = req.scope.resolve(INVOICE_MODULE)
  const configs = await svc.listInvoiceConfigs()
  const latest = Array.isArray(configs) && configs.length
    ? configs.reduce((a: any, b: any) => {
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
        return bTime > aTime ? b : a
      })
    : undefined

  res.json({
    invoice_config: latest,
  })
}

export const PostInvoiceConfigSchema = z.object({
    company_name: z.string().optional(),
    company_address: z.string().optional(),
    company_phone: z.string().optional(),
    company_email: z.string().optional(),
    company_logo: z.string().optional(),
    notes: z.string().optional(),
  })
  
  type PostInvoiceConfig = z.infer<typeof PostInvoiceConfigSchema>
  
  export async function POST(
    req: MedusaRequest<PostInvoiceConfig>,
    res: MedusaResponse
  ) {
  const body = (req.validatedBody ?? (req.body as any) ?? {}) as PostInvoiceConfig

  const { result: { invoice_config } } = await updateInvoiceConfigWorkflow(
      req.scope
    ).run({
    input: body,
    })

  // Return the latest config after update/creation
  const svc = req.scope.resolve(INVOICE_MODULE)
  const configs = await svc.listInvoiceConfigs()
  const latest = Array.isArray(configs) && configs.length
    ? configs.reduce((a: any, b: any) => {
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
        return bTime > aTime ? b : a
      })
    : invoice_config

  res.json({
    invoice_config: latest,
  })
  }