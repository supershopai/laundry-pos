import { Module } from "@medusajs/framework/utils"
import PosService from "./service"

export const POS_MODULE = "pos"

export default Module(POS_MODULE, {
  service: PosService,
})
