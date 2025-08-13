"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, Target } from "lucide-react"
import type { Discount, Filters } from "@/types/filters"

interface SavingsInsightsProps {
  discounts: Discount[]
  filters: Filters
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"]

export function SavingsInsights({ discounts, filters }: SavingsInsightsProps) {
  const insights = useMemo(() => {
    // Calculate savings by supermarket
    const supermarketSavings = discounts.reduce(
      (acc, discount) => {
        const percentage = Number.parseInt(discount.descuento.replace("%", ""))
        const tope = discount.tope ? Number.parseInt(discount.tope.replace(/[^\d]/g, "")) : 50000
        const estimatedSaving = Math.min(tope * (percentage / 100), tope * 0.3) // Estimate 30% of tope as realistic saving

        acc[discount.supermarket] = (acc[discount.supermarket] || 0) + estimatedSaving
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate distribution by payment method
    const paymentDistribution = discounts.reduce(
      (acc, discount) => {
        acc[discount.medio_pago] = (acc[discount.medio_pago] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate 30-day projection
    const thirtyDayProjection = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dayName = date.toLocaleDateString("es-AR", { weekday: "long" })

      const dayDiscounts = discounts.filter((d) => d.dia.some((day) => day.toLowerCase() === dayName.toLowerCase()))

      const dailySavings = dayDiscounts.reduce((sum, discount) => {
        const percentage = Number.parseInt(discount.descuento.replace("%", ""))
        const tope = discount.tope ? Number.parseInt(discount.tope.replace(/[^\d]/g, "")) : 50000
        return sum + Math.min(tope * (percentage / 100), 5000) // Cap daily savings at $5000
      }, 0)

      return {
        day: i + 1,
        savings: dailySavings,
        cumulative: i === 0 ? dailySavings : dailySavings,
      }
    })

    // Calculate cumulative
    for (let i = 1; i < thirtyDayProjection.length; i++) {
      thirtyDayProjection[i].cumulative = thirtyDayProjection[i - 1].cumulative + thirtyDayProjection[i].savings
    }

    return {
      supermarketData: Object.entries(supermarketSavings).map(([name, value]) => ({ name, value })),
      paymentData: Object.entries(paymentDistribution).map(([name, value]) => ({ name, value })),
      projectionData: thirtyDayProjection,
      topOpportunities: discounts
        .sort((a, b) => {
          const aPercentage = Number.parseInt(a.descuento.replace("%", ""))
          const bPercentage = Number.parseInt(b.descuento.replace("%", ""))
          return bPercentage - aPercentage
        })
        .slice(0, 3),
    }
  }, [discounts])

  if (discounts.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-muted-foreground">Selecciona algunos filtros para ver insights de ahorro</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Insights de Ahorro</h2>
      </div>

      {/* Savings by Supermarket */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Ahorro potencial por supermercado</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={insights.supermarketData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => [`$${value.toLocaleString()}`, "Ahorro estimado"]}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Distribution by Payment Method */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Distribución por método de pago</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={insights.paymentData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {insights.paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 30-day projection */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Ahorro acumulado próximos 30 días</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={insights.projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value) => [`$${value.toLocaleString()}`, "Ahorro acumulado"]}
                labelFormatter={(day) => `Día ${day}`}
              />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Opportunities */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Top 3 oportunidades hoy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.topOpportunities.map((discount, index) => (
            <div key={discount.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary">#{index + 1}</Badge>
                <div>
                  <p className="font-medium text-sm">{discount.supermarket}</p>
                  <p className="text-xs text-muted-foreground">{discount.medio_pago}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="default" className="bg-green-600">
                  {discount.descuento}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{discount.tope && `Tope ${discount.tope}`}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
