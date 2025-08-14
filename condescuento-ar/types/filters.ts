export interface Filters {
  search?: string
  supermarkets?: string[]
  paymentMethods?: string[]
  sort?: string
}

export interface Discount {
  id: string
  supermarket: string
  medio_pago: string
  descuento: string
  tope?: string
  detalles: string
  aplica_en?: string | string[]
  legales?: string
  dia?: string[]
  logo_supermarket?: string
  logo_payment?: string
}

export interface Rate {
  provider: string
  rate_annual_nominal: number
  updated_at: string
  logo?: string
}
