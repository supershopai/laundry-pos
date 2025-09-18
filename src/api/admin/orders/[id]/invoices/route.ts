import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { generateInvoicePdfWorkflow, generateThermalOrderPdfWorkflow, generateGarmentTokenPdfWorkflow } from "../../../../../workflows/generate-invoice-pdf"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params

  const { result: {
    pdf_buffer,
  } } = await generateInvoicePdfWorkflow(req.scope)
    .run({
      input: {
        order_id: id,
      },
    })

  const buffer = Buffer.from(pdf_buffer)

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
    "Content-Length": buffer.length,
  })
  
  res.send(buffer)
}

export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const kind = (req.query as any).kind || 'thermal'

  const wf = kind === 'garment' ? generateGarmentTokenPdfWorkflow : generateThermalOrderPdfWorkflow
  const { result: { pdf_buffer } } = await wf(req.scope).run({ input: { order_id: id } })
  const buffer = Buffer.from(pdf_buffer)
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${kind}-order-${id}.pdf"`,
    "Content-Length": buffer.length,
  })
  res.send(buffer)
}