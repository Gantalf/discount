"use client"

import { useState, useEffect, useCallback } from "react"
import type { Filters, Discount } from "@/types/filters"

// Mock data for demonstration
const MOCK_DISCOUNTS: Discount[] = [
  {
    id: "1",
    supermarket: "Carrefour",
    medio_pago: "Mercado Pago",
    descuento: "20%",
    tope: "$15.000",
    detalles: "Descuento en toda la tienda",
    aplica_en: "Sucursal y Online",
    legales: "Válido hasta fin de mes. No acumulable con otras promociones.",
    dia: ["Miércoles", "Jueves"],
    logo_supermarket: "/carrefour-logo.png",
    logo_payment: "/mercado-pago-logo.png",
  },
  {
    id: "2",
    supermarket: "Día",
    medio_pago: "Ualá",
    descuento: "15%",
    tope: "$10.000",
    detalles: "Miércoles de descuentos",
    aplica_en: "Solo sucursal",
    legales: "https://dia.com.ar/legales/promocion-uala",
    dia: ["Miércoles"],
    logo_supermarket: "/dia-supermarket-logo.png",
    logo_payment: "/generic-abstract-logo.png",
  },
  {
    id: "3",
    supermarket: "Coto",
    medio_pago: "Brubank",
    descuento: "25%",
    tope: "$20.000",
    detalles: "Super descuento fin de semana",
    aplica_en: "Sucursal y Online",
    legales: "Promoción válida sábados y domingos. Máximo 2 compras por cliente.",
    dia: ["Sábado", "Domingo"],
    logo_supermarket: "/generic-leaf-logo.png",
    logo_payment: "/generic-bank-logo.png",
  },
]

export function useDiscounts(filters: Filters) {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const loadDiscounts = useCallback(
    async (reset = false) => {
      setLoading(true)
      setError(null)

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Filter mock data based on filters
        let filtered = MOCK_DISCOUNTS

        if (filters.search) {
          const search = filters.search.toLowerCase()
          filtered = filtered.filter(
            (d) =>
              d.supermarket.toLowerCase().includes(search) ||
              d.medio_pago.toLowerCase().includes(search) ||
              d.detalles.toLowerCase().includes(search),
          )
        }

        if (filters.supermarkets?.length) {
          filtered = filtered.filter((d) => filters.supermarkets!.includes(d.supermarket))
        }

        if (filters.paymentMethods?.length) {
          filtered = filtered.filter((d) => filters.paymentMethods!.includes(d.medio_pago))
        }

        if (filters.days?.length) {
          filtered = filtered.filter((d) => d.dia.some((day) => filters.days!.includes(day)))
        }

        // Sort results
        if (filters.sort === "discount_desc") {
          filtered.sort((a, b) => {
            const aNum = Number.parseInt(a.descuento.replace("%", ""))
            const bNum = Number.parseInt(b.descuento.replace("%", ""))
            return bNum - aNum
          })
        }

        setDiscounts(reset ? filtered : [...discounts, ...filtered])
        setHasMore(false) // For demo, no pagination
      } catch (err) {
        setError("Error al cargar descuentos")
      } finally {
        setLoading(false)
      }
    },
    [filters, discounts],
  )

  useEffect(() => {
    loadDiscounts(true)
  }, [filters])

  const loadMore = () => {
    if (!loading && hasMore) {
      loadDiscounts(false)
    }
  }

  return {
    discounts,
    loading,
    error,
    loadMore,
    hasMore,
  }
}
