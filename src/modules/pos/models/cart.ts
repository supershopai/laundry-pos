import { model } from "@medusajs/framework/utils"

export const Cart = model.define("pos_cart", {
  id: model.id().primaryKey(),
  medusa_cart_id: model.text(),
  customer_id: model.text().nullable(),
  session_id: model.text().nullable(),
  status: model.text().default("active"),
  metadata: model.json().nullable(),
  completed_at: model.dateTime().nullable(),
})

export type PosCart = {
  id: string
  items: any[] // Will be PosCartItem[] but avoiding circular import
  customer_id?: string | null
  discount_code?: string
  discount_amount: number
  subtotal: number
  tax_amount: number
  total: number
  currency_code?: string
  created_at: Date
  updated_at: Date
}
