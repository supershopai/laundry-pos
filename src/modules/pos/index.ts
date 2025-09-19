import { Module } from "@medusajs/framework/utils"
import PosService from "./service"
import { Cart, CartItem } from "./models"

export const POS_MODULE = "posService"

export default Module(POS_MODULE, {
  service: PosService,
})
