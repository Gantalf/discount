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
        <Button variant="outline" size="sm" onClick={() => setShowCalculator(!showCalculator)}>
          <Calculator className="h-4 w-4 mr-2" />
          Calculadora
        </Button>
      </div>

      {/* Calculator */}
      {showCalculator && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Calculadora de rendimiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ahorro mensual estimado</label>
              <Input
                type="number"
                placeholder="Ej: 50000"
                value={monthlySavings}
                onChange={(e) => setMonthlySavings(e.target.value)}
                className="w-full"
              />
            </div>

            {monthlySavings && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Rendimiento mensual proyectado:</p>
                {rates.map((rate) => (
                  <div key={rate.provider} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-sm">{rate.provider}</span>
                    <Badge variant="secondary">
                      $
                      {calculateMonthlyYield(
                        rate.rate_annual_nominal,
                        Number.parseFloat(monthlySavings),
                      ).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rates Cards */}
      <div className="space-y-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          : rates.map((rate) => (
              <Card
                key={rate.provider}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        {rate.logo ? (
                          <img
                            src={rate.logo || "/placeholder.svg"}
                            alt={rate.provider}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <span className="text-xs font-bold">{rate.provider.slice(0, 2)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{rate.provider}</h3>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatLastUpdated(rate.updated_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        {rate.rate_annual_nominal}% TNA
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Ver más
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">Las tasas son referenciales y pueden cambiar sin previo aviso</p>
      </div>
    </div>
  )
}
