import type { EventContext } from '@vtex/api'
import { LogLevel, NotFoundError, ResolverError } from '@vtex/api'
import { clearString } from '../utils/clearString'


import type { Clients } from '../clients'

export async function skuChange(ctx: EventContext<Clients>) {

  const {
    clients: { catalog: catalogClient },
  } = ctx

  const { IdSku, HasStockKeepingUnitModified } = ctx.body

  if (!HasStockKeepingUnitModified) return

  let sku, product

  try {
    sku = await catalogClient.getSku(IdSku)

    const productId = sku.ProductId
    product = await catalogClient.getProduct(productId)

    const newTextLink = clearString(product.LinkId)
    try {
      await catalogClient.updateProduct(
        {
          Name: product.Name,
          CategoryId: product.CategoryId,
          BrandId: product.BrandId,
          LinkId: newTextLink
        },
        productId
      )
    } catch (error) {
      const erroMessage = `Product ${productId} cannot be updated.`
      const splunkError = {
        error: erroMessage,
        detail: error,
      }

      ctx.vtex.logger.log(splunkError, LogLevel.Error)
      throw new ResolverError(erroMessage)
    }

  } catch (error) {
    const erroMessage = `SKU ${IdSku} not found.`
    const splunkError = {
      error: erroMessage,
      detail: error,
    }

    ctx.vtex.logger.log(splunkError, LogLevel.Error)
    throw new NotFoundError(erroMessage)
  }

  return true
}
