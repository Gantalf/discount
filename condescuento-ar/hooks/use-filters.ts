"use client"

import { useState, useEffect } from "react"
import type { Filters } from "@/types/filters"

export function useFilters() {
  const [filters, setFilters] = useState<Filters>({})
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load saved filters from localStorage only after hydration
  useEffect(() => {
    if (!isHydrated) return

    const saved = localStorage.getItem("condescuento-filters")
    if (saved) {
      try {
        setFilters(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse saved filters:", e)
      }
    }
  }, [isHydrated])

  // Save filters to localStorage only after hydration
  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem("condescuento-filters", JSON.stringify(filters))
  }, [filters, isHydrated])

  const updateFilters = (newFilters: Partial<Filters>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters }

      if ("supermarkets" in newFilters && newFilters.supermarkets?.length) {
        delete updated.paymentMethods
      }

      if ("paymentMethods" in newFilters && newFilters.paymentMethods?.length) {
        delete updated.supermarkets
      }

      return updated
    })
  }

  const resetFilters = () => {
    setFilters({})
  }

  return {
    filters,
    updateFilters,
    resetFilters,
  }
}
