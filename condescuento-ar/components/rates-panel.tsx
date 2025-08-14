"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Calculator, ExternalLink, TrendingUp, Clock } from "lucide-react"
import type { Rate } from "@/types/filters"

// Mock rates data
const MOCK_RATES: Rate[] = [
  {
    provider: "Mercado Pago",
    rate_annual_nominal: 45.5,
    updated_at: "2024-01-15T10:30:00Z",
    logo: "/mercado-pago-logo.png",
  },
  {
    provider: "Ualá",
    rate_annual_nominal: 42.0,
    updated_at: "2024-01-15T09:15:00Z",
    logo: "/generic-abstract-logo.png",
  },
  {
    provider: "Brubank",
    rate_annual_nominal: 48.2,
    updated_at: "2024-01-15T11:45:00Z",
    logo: "/generic-bank-logo.png",
  },
]

export function RatesPanel() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlySavings, setMonthlySavings] = useState<string>("")
  const [showCalculator, setShowCalculator] = useState(false)

  useEffect(() => {
    // Simulate API call
    const loadRates = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setRates(MOCK_RATES)
      setLoading(false)
    }

    loadRates()
  }, [])

  const calculateMonthlyYield = (annualRate: number, monthlyAmount: number) => {
    const monthlyRate = annualRate / 100 / 12
    return monthlyAmount * monthlyRate
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffHours < 1) return "Hace menos de 1 hora"
    if (diffHours < 24) return `Hace ${diffHours} horas`
    return `Hace ${Math.floor(diffHours / 24)} días`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Cuentas Remuneradas</h2>
        </div>
        <Button asChild variant="outline" size="sm">
          <a
            href="https://comparatasas.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center"
          >
            Busca la mejor tasa
          </a>
        </Button>
      </div>
    </div>
  )
}
