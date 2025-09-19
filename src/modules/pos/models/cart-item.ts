import { model } from "@medusajs/framework/utils"

export const CartItem = model.define("pos_cart_item", {
  id: model.id().primaryKey(),
  cart_id: model.text(),
  medusa_line_item_id: model.text(),
  product_id: model.text(),
  variant_id: model.text(),
  title: model.text(),
  variant_title: model.text().nullable(),
  sku: model.text().nullable(),
  quantity: model.number().default(1),
  unit_price: model.number(),
  currency_code: model.text().default("inr"),
  metadata: model.json().nullable(),
})

export type PosCartItem = {
  id: string
  cart_id: string
  medusa_line_item_id: string
  product_id: string
  variant_id: string
  title: string
  variant_title?: string | null
  sku?: string | null
  quantity: number
  unit_price: number
  currency_code: string
  metadata?: any | null
  created_at: Date
  updated_at: Date
}
