import { MedusaService } from "@medusajs/framework/utils"
import { Modules } from "@medusajs/framework/utils"
import { InvoiceConfig } from "./models/invoice-config"
import { Invoice, InvoiceStatus } from "./models/invoice"
import PdfPrinter from "pdfmake"
import { 
  InferTypeOf, 
  OrderDTO, 
  OrderLineItemDTO,
} from "@medusajs/framework/types"
import axios from "axios"

const fonts = {
    Helvetica: {
      normal: "Helvetica",
      bold: "Helvetica-Bold",
      italics: "Helvetica-Oblique",
      bolditalics: "Helvetica-BoldOblique",
    },
  }
  
  const printer = new PdfPrinter(fonts)
  
  type GeneratePdfParams = {
    order: OrderDTO
    items: OrderLineItemDTO[]
  }



// class InvoiceGeneratorService extends MedusaService({
//   InvoiceConfig,
//   Invoice,
// }) { }

class InvoiceGeneratorService extends MedusaService({
    InvoiceConfig,
    Invoice,
  }) {

    private async createInvoiceContent(
        params: GeneratePdfParams, 
        invoice: InferTypeOf<typeof Invoice>
      ): Promise<Record<string, any>> {
        // Get invoice configuration
        const invoiceConfigs = await this.listInvoiceConfigs()
        const config = invoiceConfigs[0] || {}
    
        // Create table for order items
        const itemsTable = [
          [
            { text: "Item", style: "tableHeader" },
            { text: "Quantity", style: "tableHeader" },
            { text: "Unit Price", style: "tableHeader" },
            { text: "Total", style: "tableHeader" },
          ],
          ...(await Promise.all(params.items.map(async (item) => [
            { text: item.title || "Unknown Item", style: "tableRow" },
            { text: item.quantity.toString(), style: "tableRow" },
            { text: await this.formatAmount(
              item.unit_price, 
              params.order.currency_code
            ), style: "tableRow" },
            { text: await this.formatAmount(
              Number(item.total), 
              params.order.currency_code
            ), style: "tableRow" },
          ]))),
        ]
    
        const invoiceId = `INV-${invoice.display_id.toString().padStart(6, "0")}`
        const invoiceDate = new Date(invoice.created_at).toLocaleDateString()
    
        // return the PDF content structure
        return {
          pageSize: "A4",
          pageMargins: [40, 60, 40, 60],
          header: {
            margin: [40, 20, 40, 0],
            columns: [
              /** Company Logo */
              {
                width: "*",
                stack: [
                  ...(config.company_logo ? [
                    {
                      image: await this.imageUrlToBase64(config.company_logo),
                      width: 80,
                      height: 40,
                      fit: [80, 40],
                      margin: [0, 0, 0, 10],
                    },
                  ] : []),
                  {
                    text: config.company_name || "Your Company Name",
                    style: "companyName",
                    margin: [0, 0, 0, 0],
                  },
                ],
              },
              /** Invoice Title */
              {
                width: "auto",
                stack: [
                  {
                    text: "INVOICE",
                    style: "invoiceTitle",
                    alignment: "right",
                    margin: [0, 0, 0, 0],
                  },
                ],
              },
            ],
          },
          content: [
            {
              margin: [0, 20, 0, 0],
              columns: [
                /** Company Details */
                {
                  width: "*",
                  stack: [
                    {
                      text: "COMPANY DETAILS",
                      style: "sectionHeader",
                      margin: [0, 0, 0, 8],
                    },
                    config.company_address && {
                      text: config.company_address,
                      style: "companyAddress",
                      margin: [0, 0, 0, 4],
                    },
                    config.company_phone && {
                      text: config.company_phone,
                      style: "companyContact",
                      margin: [0, 0, 0, 4],
                    },
                    config.company_email && {
                      text: config.company_email,
                      style: "companyContact",
                      margin: [0, 0, 0, 0],
                    },
                  ],
                },
                /** Invoice Details */
                {
                  width: "auto",
                  table: {
                    widths: [80, 120],
                    body: [
                      [
                        { text: "Invoice ID:", style: "label" },
                        { text: invoiceId, style: "value" },
                      ],
                      [
                        { text: "Invoice Date:", style: "label" },
                        { text: invoiceDate, style: "value" },
                      ],
                      [
                        { text: "Order ID:", style: "label" },
                        { 
                          text: params.order.display_id.toString().padStart(6, "0"), 
                          style: "value",
                        },
                      ],
                      [
                        { text: "Order Date:", style: "label" },
                        { 
                          text: new Date(params.order.created_at).toLocaleDateString(), 
                          style: "value",
                        },
                      ],
                    ],
                  },
                  layout: "noBorders",
                  margin: [0, 0, 0, 20],
                },
              ],
            },
            {
              text: "\n",
            },
            /** Billing and Shipping Addresses */
            {
              columns: [
                {
                  width: "*",
                  stack: [
                    {
                      text: "BILL TO",
                      style: "sectionHeader",
                      margin: [0, 0, 0, 8],
                    },
                    {
                      text: params.order.billing_address ? 
                        `${params.order.billing_address.first_name || ""} ${params.order.billing_address.last_name || ""}
                        ${params.order.billing_address.address_1 || ""}${params.order.billing_address.address_2 ? `\n${params.order.billing_address.address_2}` : ""}
                        ${params.order.billing_address.city || ""}, ${params.order.billing_address.province || ""} ${params.order.billing_address.postal_code || ""}
                        ${params.order.billing_address.country_code || ""}${params.order.billing_address.phone ? `\n${params.order.billing_address.phone}` : ""}` : 
                        "No billing address provided",
                      style: "addressText",
                    },
                  ],
                },
                {
                  width: "*",
                  stack: [
                    {
                      text: "SHIP TO",
                      style: "sectionHeader",
                      margin: [0, 0, 0, 8],
                    },
                    {
                      text: params.order.shipping_address ? 
                        `${params.order.shipping_address.first_name || ""} ${params.order.shipping_address.last_name || ""}
                        ${params.order.shipping_address.address_1 || ""} ${params.order.shipping_address.address_2 ? `\n${params.order.shipping_address.address_2}` : ""}
                        ${params.order.shipping_address.city || ""}, ${params.order.shipping_address.province || ""} ${params.order.shipping_address.postal_code || ""}
                        ${params.order.shipping_address.country_code || ""}${params.order.shipping_address.phone ? `\n${params.order.shipping_address.phone}` : ""}` : 
                        "No shipping address provided",
                      style: "addressText",
                    },
                  ],
                },
              ],
            },
            {
              text: "\n\n",
            },
            /** Items Table */
            {
              table: {
                headerRows: 1,
                widths: ["*", "auto", "auto", "auto"],
                body: itemsTable,
              },
              layout: {
                fillColor: function (rowIndex: number) {
                  return (rowIndex === 0) ? "#f8f9fa" : null
                },
                hLineWidth: function (i: number, node: any) {
                  return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3
                },
                vLineWidth: function (i: number, node: any) {
                  return 0.3
                },
                hLineColor: function (i: number, node: any) {
                  return (i === 0 || i === node.table.body.length) ? "#cbd5e0" : "#e2e8f0"
                },
                vLineColor: function () {
                  return "#e2e8f0"
                },
                paddingLeft: function () {
                  return 8
                },
                paddingRight: function () {
                  return 8
                },
                paddingTop: function () {
                  return 6
                },
                paddingBottom: function () {
                  return 6
                },
              },
            },
            {
              text: "\n",
            },
            /** Totals Section */
            {
              columns: [
                { width: "*", text: "" },
                {
                  width: "auto",
                  table: {
                    widths: ["auto", "auto"],
                    body: [
                      [
                        { text: "Subtotal:", style: "totalLabel" },
                        { 
                          text: await this.formatAmount(
                            Number(params.order.subtotal), 
                            params.order.currency_code), 
                          style: "totalValue",
                        },
                      ],
                      [
                        { text: "Tax:", style: "totalLabel" },
                        { 
                          text: await this.formatAmount(
                            Number(params.order.tax_total), 
                            params.order.currency_code), 
                          style: "totalValue",
                        },
                      ],
                      [
                        { text: "Shipping:", style: "totalLabel" },
                        { 
                          text: await this.formatAmount(
                            Number(params.order.shipping_methods?.[0]?.total || 0), 
                            params.order.currency_code), 
                          style: "totalValue",
                        },
                      ],
                      [
                        { text: "Discount:", style: "totalLabel" },
                        { 
                          text: await this.formatAmount(
                            Number(params.order.discount_total), 
                            params.order.currency_code), 
                          style: "totalValue",
                        },
                      ],
                      [
                        { text: "Total:", style: "totalLabel" },
                        { 
                          text: await this.formatAmount(
                            Number(params.order.total), 
                            params.order.currency_code), 
                          style: "totalValue",
                        },
                      ],
                    ],
                  },
                  layout: {
                    fillColor: function (rowIndex: number) {
                      return (rowIndex === 3) ? "#f8f9fa" : null
                    },
                    hLineWidth: function (i: number, node: any) {
                      return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3
                    },
                    vLineWidth: function () {
                      return 0.3
                    },
                    hLineColor: function (i: number, node: any) {
                      return (i === 0 || i === node.table.body.length) ? "#cbd5e0" : "#e2e8f0"
                    },
                    vLineColor: function () {
                      return "#e2e8f0"
                    },
                    paddingLeft: function () {
                      return 8
                    },
                    paddingRight: function () {
                      return 8
                    },
                    paddingTop: function () {
                      return 6
                    },
                    paddingBottom: function () {
                      return 6
                    },
                  },
                },
              ],
            },
            {
              text: "\n\n",
            },
            /** Notes Section */
            ...(config.notes ? [
              {
                text: "Notes",
                style: "sectionHeader",
                margin: [0, 20, 0, 10],
              },
              {
                text: config.notes,
                style: "notesText",
                margin: [0, 0, 0, 20],
              },
            ] : []),
            {
              text: "Thank you for your business!",
              style: "thankYouText",
              alignment: "center",
              margin: [0, 30, 0, 0],
            },
          ],
          styles: {
            companyName: {
              fontSize: 22,
              bold: true,
              color: "#1a365d",
              margin: [0, 0, 0, 5],
            },
            companyAddress: {
              fontSize: 11,
              color: "#4a5568",
              lineHeight: 1.3,
            },
            companyContact: {
              fontSize: 10,
              color: "#4a5568",
            },
            invoiceTitle: {
              fontSize: 24,
              bold: true,
              color: "#2c3e50",
            },
            label: {
              fontSize: 10,
              color: "#6c757d",
              margin: [0, 0, 8, 0],
            },
            value: {
              fontSize: 10,
              bold: true,
              color: "#2c3e50",
            },
            sectionHeader: {
              fontSize: 12,
              bold: true,
              color: "#2c3e50",
              backgroundColor: "#f8f9fa",
              padding: [8, 12],
            },
            addressText: {
              fontSize: 10,
              color: "#495057",
              lineHeight: 1.3,
            },
            tableHeader: {
              fontSize: 10,
              bold: true,
              color: "#ffffff",
              fillColor: "#495057",
            },
            tableRow: {
              fontSize: 9,
              color: "#495057",
            },
            totalLabel: {
              fontSize: 10,
              bold: true,
              color: "#495057",
            },
            totalValue: {
              fontSize: 10,
              bold: true,
              color: "#2c3e50",
            },
            notesText: {
              fontSize: 10,
              color: "#6c757d",
              italics: true,
              lineHeight: 1.4,
            },
            thankYouText: {
              fontSize: 12,
              color: "#28a745",
              italics: true,
            },
          },
          defaultStyle: {
            font: "Helvetica",
          },
        }
      }

      async generatePdf(params: GeneratePdfParams & {
        invoice_id: string
      }): Promise<Buffer> {
        const invoice = await this.retrieveInvoice(params.invoice_id)
    
        // Always regenerate content to reflect latest invoice config
        const pdfContent = await this.createInvoiceContent(params, invoice)
    
        await this.updateInvoices({
          id: invoice.id,
          pdfContent,
        })
    
        // get PDF as a Buffer
        return new Promise((resolve, reject) => {
          const chunks: Buffer[] = []
      
          const pdfDoc = printer.createPdfKitDocument(pdfContent as any)
          
          pdfDoc.on("data", (chunk) => chunks.push(chunk))
          pdfDoc.on("end", () => {
            const result = Buffer.concat(chunks)
            resolve(result)
          })
          pdfDoc.on("error", (err) => reject(err))
      
          pdfDoc.end() // Finalize PDF stream
        })
      }
    
      async generateThermalOrderPdf(params: GeneratePdfParams, container?: any): Promise<Buffer> {
        const order: any = params.order
        const items = params.items as any[]
        const configs = await this.listInvoiceConfigs()
        const cfg: any = configs[0] || {}
        
        // Get the order module service to retrieve calculated totals
        const orderModuleService = container?.resolve(Modules.ORDER)
        
        // Retrieve order with calculated totals using Medusa's built-in method
        let calculatedOrder = order
        if (orderModuleService) {
          try {
            calculatedOrder = await orderModuleService.retrieveOrder(order.id, {
              relations: ['items', 'items.adjustments']
            })
            console.log('📊 Thermal printer - Order retrieved with calculated totals:', {
              subtotal: calculatedOrder.subtotal,
              discount_total: calculatedOrder.discount_total,
              tax_total: calculatedOrder.tax_total,
              total: calculatedOrder.total
            })
          } catch (error) {
            console.log('⚠️ Could not retrieve calculated order totals, using provided order:', error.message)
          }
        } else {
          console.log('⚠️ Order module service not available, using provided order')
        }

        const headerBlocks: any[] = []
        if (cfg.company_logo) {
          try {
            headerBlocks.push({ image: await this.imageUrlToBase64(cfg.company_logo), width: 80, alignment: 'center', margin: [0, 0, 0, 4] })
          } catch {}
        }
        if (cfg.company_name) headerBlocks.push({ text: cfg.company_name, alignment: 'center', bold: true, margin: [0, 2, 0, 2] })
        if (cfg.company_address) headerBlocks.push({ text: cfg.company_address, alignment: 'center', fontSize: 8, margin: [0, 0, 0, 2] })
        const phoneLine = [cfg.company_phone, cfg.company_email].filter(Boolean).join(' | ')
        if (phoneLine) headerBlocks.push({ text: phoneLine, alignment: 'center', fontSize: 8, margin: [0, 0, 0, 6] })

        const itemRows = await Promise.all(items.map(async (i) => [
          { text: i?.title || i?.description || '', fontSize: 9 },
          { text: `${i?.quantity || 1}`, alignment: 'right', fontSize: 9 },
          { text: await this.formatAmount(i?.total ?? (i?.unit_price || 0) * (i?.quantity || 1), order.currency_code || 'inr'), alignment: 'right', fontSize: 9 },
        ]))

        const bodyTable = [
          [{ text: 'Item', bold: true }, { text: 'Qty', bold: true, alignment: 'right' }, { text: 'Amount', bold: true, alignment: 'right' }],
          ...itemRows,
        ]

        // Helper function to safely convert BigNumber or number to number
        const safeNumber = (value: any): number => {
          if (value?.toNumber) return value.toNumber()
          if (typeof value === 'number' && !isNaN(value)) return value
          return 0
        }
        
        // Calculate subtotal from order items
        const calculatedSubtotal = calculatedOrder.items?.reduce((total, item) => {
          const itemTotal = (item.unit_price || 0) * (item.quantity || 1)
          return total + itemTotal
        }, 0) || 0
        
        // Calculate discount total from order item adjustments
        const calculatedDiscountTotal = calculatedOrder.items?.reduce((total, item) => {
          const itemDiscount = item.adjustments?.reduce((sum, adj) => {
            let amount = adj.amount || 0
            if (amount && typeof amount === 'object' && amount.toNumber) {
              amount = amount.toNumber()
            }
            return sum + amount
          }, 0) || 0
          return total + itemDiscount
        }, 0) || 0
        
        // Use calculated values from order items - NO FALLBACKS
        const subtotal = calculatedSubtotal
        const taxTotal = safeNumber(calculatedOrder.tax_total)
        const shippingTotal = safeNumber(calculatedOrder.shipping_methods?.[0]?.total || 0)
        const discountTotal = calculatedDiscountTotal
        
        // Calculate total using standard formula: subtotal + tax + shipping - discount
        const total = subtotal + taxTotal + shippingTotal - discountTotal
        
        console.log('📊 Thermal printer totals from order:', {
          subtotal,
          taxTotal,
          shippingTotal,
          discountTotal,
          total,
          calculatedDiscountFromAdjustments: calculatedDiscountTotal
        })

        const totalsTable = [
          [
            { text: 'Subtotal:', fontSize: 9, alignment: 'left' },
            { text: await this.formatAmount(subtotal, order.currency_code || 'inr'), fontSize: 9, alignment: 'right' }
          ],
          [
            { text: 'Tax:', fontSize: 9, alignment: 'left' },
            { text: await this.formatAmount(taxTotal, order.currency_code || 'inr'), fontSize: 9, alignment: 'right' }
          ],
          [
            { text: 'Shipping:', fontSize: 9, alignment: 'left' },
            { text: await this.formatAmount(shippingTotal, order.currency_code || 'inr'), fontSize: 9, alignment: 'right' }
          ],
          [
            { text: 'Discount:', fontSize: 9, alignment: 'left' },
            { text: await this.formatAmount(discountTotal, order.currency_code || 'inr'), fontSize: 9, alignment: 'right' }
          ],
          [
            { text: 'Total:', fontSize: 9, bold: true, alignment: 'left' },
            { text: await this.formatAmount(total, order.currency_code || 'inr'), fontSize: 9, bold: true, alignment: 'right' }
          ]
        ]

        const pdfContent: any = {
          pageSize: { width: 226, height: 'auto' },
          pageMargins: [10, 8, 10, 8],
          content: [
            ...headerBlocks,
            { canvas: [ { type: 'line', x1: 0, y1: 0, x2: 206, y2: 0, lineWidth: 1 } ], margin: [0, 4, 0, 6] },
            { text: `# ${order.display_id}`, alignment: 'center', bold: true, margin: [0, 0, 0, 4] },
            { text: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(), alignment: 'center', bold: true, margin: [0, 0, 0, 2] },
            { text: `Mobile: ${order.customer?.phone || order.billing_address?.phone || ''}`.trim(), alignment: 'center', fontSize: 9, margin: [0, 0, 0, 2] },
            { text: `Date: ${new Date(order.created_at).toLocaleDateString()}`, alignment: 'center', fontSize: 9, margin: [0, 0, 0, 6] },
            { table: { widths: ['*','auto','auto'], body: bodyTable }, layout: 'lightHorizontalLines', alignment: 'center' },
            { text: '\n' },
            { table: { widths: ['*','auto'], body: totalsTable }, layout: 'noBorders', alignment: 'center' },
            { text: 'Thank you for your visit', alignment: 'center', fontSize: 9, margin: [0, 8, 0, 0] }
          ],
          defaultStyle: { font: 'Helvetica', fontSize: 10 }
        }

        return new Promise((resolve, reject) => {
          const chunks: Buffer[] = []
          const pdfDoc = printer.createPdfKitDocument(pdfContent as any)
          pdfDoc.on('data', (c) => chunks.push(c))
          pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
          pdfDoc.on('error', (e) => reject(e))
          pdfDoc.end()
        })
      }

      async generateGarmentTokenPdf(params: { order: OrderDTO }): Promise<Buffer> {
        const order: any = params.order
        const items: any[] = order.items || []
        const pageWidth = 226

        // Build one small page per garment (per quantity)
        const content: any[] = []
        const totalPieces = items.reduce((acc, it: any) => acc + Number(it.quantity || 1), 0)
        let pieceCounter = 0
        items.forEach((it) => {
          const qty = Number(it.quantity || 1)
          for (let idx = 1; idx <= qty; idx++) {
            pieceCounter += 1
            content.push(
              { text: `# ${order.display_id}`, alignment: 'center', bold: true, fontSize: 18, margin: [0, 0, 0, 6] },
              { text: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(), alignment: 'center', bold: true, fontSize: 16, margin: [0, 0, 0, 2] },
              { text: `${order.customer?.email || ''}`, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 4] },
              { text: `${new Date(order.created_at).toLocaleDateString(undefined, { day:'2-digit', month:'short', year:'2-digit' })}`, alignment: 'center', fontSize: 12, margin: [0, 0, 0, 6] },
              { text: `${it.title || it.description || 'Item'}`, alignment: 'center', bold: true, fontSize: 16, margin: [0, 0, 0, 2] },
              { text: `${it.variant?.sku ? `SKU: ${it.variant.sku}` : ''}`, alignment: 'center', fontSize: 10, margin: [0, 0, 0, 4] },
              { text: `${idx}/${qty}`, alignment: 'center', bold: true, fontSize: 16, margin: [0, 0, 0, 6] },
              { text: '--------------', alignment: 'center', margin: [0, 4, 0, 0] },
            )
            if (pieceCounter < totalPieces) {
              content.push({ text: ' ', pageBreak: 'after' })
            }
          }
        })

        const pdfContent: any = {
          pageSize: { width: pageWidth, height: 200 },
          pageMargins: [10, 8, 10, 8],
          content,
          defaultStyle: { font: 'Helvetica', alignment: 'center' }
        }

        return new Promise((resolve, reject) => {
          const chunks: Buffer[] = []
          const pdfDoc = printer.createPdfKitDocument(pdfContent as any)
          pdfDoc.on('data', (c) => chunks.push(c))
          pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
          pdfDoc.on('error', (e) => reject(e))
          pdfDoc.end()
        })
      }


    private async formatAmount(amount: number, currency: string): Promise<string> {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(amount)
    }
  
    private async imageUrlToBase64(url: string): Promise<string> {
      try {
        const response = await axios.get(url, { responseType: "arraybuffer" })
        const base64 = Buffer.from(response.data).toString("base64")
        let mimeType = response.headers["content-type"] || "image/png"
        
        // Convert webp to png for pdfmake compatibility
        if (mimeType === "image/webp") {
          mimeType = "image/png"
        }
        
        return `data:${mimeType};base64,${base64}`
      } catch (error) {
        console.log('⚠️ Error converting image to base64:', error.message)
        // Return a placeholder if image conversion fails
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      }
    }
  }

export default InvoiceGeneratorService