import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

const applyPromotionToCartStep = createStep(
  "apply-promotion-to-cart",
  async (input: { cartId: string; promotionId: string }, { container }) => {
    const promotionModuleService = container.resolve(Modules.PROMOTION)
    const cartModuleService = container.resolve(Modules.CART)

    const { cartId, promotionId } = input

    // Get the promotion details
    const promotion = await promotionModuleService.retrievePromotion(promotionId)
    
    if (!promotion) {
      throw new Error(`Promotion with ID ${promotionId} not found`)
    }

    // Check if promotion is active
    const now = new Date()
    if (promotion.campaign?.ends_at && new Date(promotion.campaign.ends_at) < now) {
      throw new Error('This promotion has expired')
    }

    if (promotion.campaign?.starts_at && new Date(promotion.campaign.starts_at) > now) {
      throw new Error('This promotion is not yet active')
    }

    // Get current cart
    const cart = await cartModuleService.retrieveCart(cartId, {
      relations: ['items', 'items.adjustments']
    })

    // Use computeActions to apply promotion
    const cartData: any = {
      items: cart.items,
      subtotal: cart.subtotal,
      total: cart.total,
      currency_code: cart.currency_code,
      region_id: cart.region_id,
      customer_id: cart.customer_id
    }
    
    const actions = await (promotionModuleService as any).computeActions([promotion.code], cartData)

    // Execute actions
    for (const action of actions) {
      if (action.action === 'addItemAdjustment') {
        await cartModuleService.addLineItemAdjustments([{
          item_id: action.item_id,
          amount: action.amount,
          code: action.code,
          is_tax_inclusive: action.is_tax_inclusive || false
        }])
      }
    }

    // Get updated cart
    const updatedCart = await cartModuleService.retrieveCart(cartId, {
      relations: ['items', 'items.adjustments']
    })

    return new StepResponse({ cart: updatedCart, promotion }, { cartId, promotionId })
  },
  async (input: { cartId: string; promotionId: string }, { container }) => {
    const { cartId } = input
    if (!cartId) {
      return
    }

    const cartModuleService = container.resolve(Modules.CART)

    // Remove all line item adjustments
    const cart = await cartModuleService.retrieveCart(cartId, {
      relations: ['items', 'items.adjustments']
    })

    for (const item of cart.items || []) {
      if (item.adjustments && item.adjustments.length > 0) {
        await cartModuleService.setLineItemAdjustments(item.id, [])
      }
    }
  }
)

const removePromotionFromCartStep = createStep(
  "remove-promotion-from-cart",
  async (input: { cartId: string }, { container }) => {
    const cartModuleService = container.resolve(Modules.CART)
    const { cartId } = input

    // Get current cart
    const cart = await cartModuleService.retrieveCart(cartId, {
      relations: ['items', 'items.adjustments']
    })

    // Remove all line item adjustments
    for (const item of cart.items || []) {
      if (item.adjustments && item.adjustments.length > 0) {
        await cartModuleService.setLineItemAdjustments(item.id, [])
      }
    }

    // Get updated cart
    const updatedCart = await cartModuleService.retrieveCart(cartId, {
      relations: ['items', 'items.adjustments']
    })

    return new StepResponse({ cart: updatedCart }, { cartId })
  },
  async (input: { cartId: string }, { container }) => {
    // No rollback needed for removal
  }
)

export const applyPromotionToCartWorkflow = createWorkflow(
  "apply-promotion-to-cart",
  (input: { cartId: string; promotionId: string }) => {
    const { cart, promotion } = applyPromotionToCartStep(input)

    return new WorkflowResponse({
      cart,
      promotion,
    })
  }
)

export const removePromotionFromCartWorkflow = createWorkflow(
  "remove-promotion-from-cart",
  (input: { cartId: string }) => {
    const { cart } = removePromotionFromCartStep(input)

    return new WorkflowResponse({
      cart,
    })
  }
)

