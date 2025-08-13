"use client"

import { useState, useEffect, useCallback } from "react"
import type { Filters, Discount } from "@/types/filters"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || ""

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto).randomUUID()
  }
  return Math.random().toString(36).substring(2, 9)
}

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
        let fetched: Discount[] = []

        const hasFilter =
          (filters.supermarkets && filters.supermarkets.length > 0) ||
          (filters.paymentMethods && filters.paymentMethods.length > 0)

        if (!hasFilter) {
          const res = await fetch(`${API_BASE}/promotions/top`)
          const data = await res.json()
          const items = data.top_discounts || []
          fetched = items.flatMap((item: any) =>
            (item.discounts || item.descuentos || []).map((d: any) => ({
              id: generateId(),
              supermarket: item.supermarket || item.supermercado || "",
              medio_pago: d.medio_pago,
              descuento: d.descuento,
              tope: d.tope,
              detalles: d.detalles,
              aplica_en: d.aplica_en,
              legales: d.legales || "",
              dia: d.dia || [],
              logo_supermarket: d.logo_supermarket,
              logo_payment: d.logo_payment,
            }))
          )
        } else {
          const requests: Promise<any>[] = []
          const wallets = filters.paymentMethods || []
          const markets = filters.supermarkets || []

          wallets.forEach((wallet) =>
            requests.push(
              fetch(`${API_BASE}/promotions/user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filterType: "wallet", filterValue: wallet }),
              }).then((res) => res.json())
            )
          )

          markets.forEach((market) =>
            requests.push(
              fetch(`${API_BASE}/promotions/user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filterType: "supermarket", filterValue: market }),
              }).then((res) => res.json())
            )
          )

          const results = await Promise.all(requests)
          fetched = results.flatMap((res) =>
            (res.result || []).flatMap((item: any) =>
              (item.discounts || item.descuentos || []).map((d: any) => ({
                id: generateId(),
                supermarket: item.supermarket || item.supermercado || "",
                medio_pago: d.medio_pago,
                descuento: d.descuento,
                tope: d.tope,
                detalles: d.detalles,
                aplica_en: d.aplica_en,
                legales: d.legales || "",
                dia: d.dia || [],
                logo_supermarket: d.logo_supermarket,
                logo_payment: d.logo_payment,
              }))
            )
          )
        }

        // Search filter
        if (filters.search) {
          const search = filters.search.toLowerCase()
          fetched = fetched.filter(
            (d) =>
              d.supermarket.toLowerCase().includes(search) ||
              d.medio_pago.toLowerCase().includes(search) ||
              d.detalles.toLowerCase().includes(search)
          )
        }

        // Sort results
        if (filters.sort === "discount_desc") {
          fetched.sort((a, b) => {
            const aNum = parseInt(a.descuento?.replace("%", "") || "0")
            const bNum = parseInt(b.descuento?.replace("%", "") || "0")
            return bNum - aNum
          })
        }

        setDiscounts((prev) => (reset ? fetched : [...prev, ...fetched]))
        setHasMore(false)
      } catch (err) {
        console.error(err)
        setError("Error al cargar descuentos")
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  useEffect(() => {
    loadDiscounts(true)
  }, [filters, loadDiscounts])

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

