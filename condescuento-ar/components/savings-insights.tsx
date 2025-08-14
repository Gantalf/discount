"use client"

import { useMemo } from "react"
import { useTheme } from "next-themes"
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

// Paleta usada por el PieChart y la leyenda
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1"]

export function SavingsInsights({ discounts, filters }: SavingsInsightsProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const insights = useMemo(() => {
    // Calculate savings by supermarket
    const supermarketSavings = discounts.reduce(
      (acc, discount) => {
        const percentageStr = discount.descuento.replace("%", "").trim()
        const percentage = parseInt(percentageStr, 10)
        if (isNaN(percentage) || percentage <= 0) return acc

        let tope = 50000
        if (discount.tope) {
          const topeStr = discount.tope.replace(/[^\d]/g, "")
          const topeParsed = parseInt(topeStr, 10)
          if (!isNaN(topeParsed) && topeParsed > 0) tope = topeParsed
        }

        const averagePurchase = 50000
        const estimatedSaving = Math.min(
          averagePurchase * (percentage / 100),
          tope * (percentage / 100),
        )

        if (!acc[discount.supermarket]) acc[discount.supermarket] = 0
        acc[discount.supermarket] += estimatedSaving
        return acc
      },
      {} as Record<string, number>,
    )

    // Distribution by payment method
    const paymentDistribution = discounts.reduce(
      (acc, discount) => {
        acc[discount.medio_pago] = (acc[discount.medio_pago] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // 30-day projection (simplificada)
    const thirtyDayProjection = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dayName = date.toLocaleDateString("es-AR", { weekday: "long" })
      const dayDiscounts = discounts.filter(
        (d) => d.dia && d.dia.some((day) => day.toLowerCase() === dayName.toLowerCase()),
      )
      const dailySavings = dayDiscounts.reduce((sum, discount) => {
        const percentageStr = discount.descuento.replace("%", "").trim()
        const percentage = parseInt(percentageStr, 10)
        if (isNaN(percentage) || percentage <= 0) return sum

        let tope = 50000
        if (discount.tope) {
          const topeStr = discount.tope.replace(/[^\d]/g, "")
          const topeParsed = parseInt(topeStr, 10)
          if (!isNaN(topeParsed) && topeParsed > 0) tope = topeParsed
        }

        const averagePurchase = 50000
        return sum + Math.min(averagePurchase * (percentage / 100), tope * (percentage / 100))
      }, 0)

      return { day: i + 1, savings: dailySavings, cumulative: i === 0 ? dailySavings : dailySavings }
    })

    for (let i = 1; i < thirtyDayProjection.length; i++) {
      thirtyDayProjection[i].cumulative =
        thirtyDayProjection[i - 1].cumulative + thirtyDayProjection[i].savings
    }

    return {
      supermarketData: Object.entries(supermarketSavings)
        .filter(([_, value]) => value != null && !isNaN(value) && value > 0)
        .map(([name, value]) => ({ name, value })),
      paymentData: Object.entries(paymentDistribution).map(([name, value]) => ({ name, value })),
      projectionData: thirtyDayProjection,
      topOpportunities: discounts
        .sort((a, b) => {
          const aPct = parseInt(a.descuento.replace("%", "").trim(), 10) || 0
          const bPct = parseInt(b.descuento.replace("%", "").trim(), 10) || 0
          return bPct - aPct
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
            <p className="text-muted-foreground">
              Selecciona algunos filtros para ver insights de ahorro
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Colores según tema para el BarChart
  const barFill = isDark ? "#ffffff" : "hsl(var(--primary))"
  const tooltipBg = isDark ? "rgba(16,16,16,0.95)" : "hsl(var(--popover))"
  const tooltipBrd = isDark ? "rgba(255,255,255,0.2)" : "hsl(var(--border))"
  const tooltipText = isDark ? "#ffffff" : "hsl(var(--popover-foreground))"

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Insights de Ahorro</h2>
      </div>

      {/* Savings by Supermarket (Bar) */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Ahorro potencial por supermercado</CardTitle>
          <p className="text-sm text-muted-foreground">
            {insights.supermarketData.length} supermercado
            {insights.supermarketData.length !== 1 ? "s" : ""} con promociones
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative text-muted-foreground">
            <ResponsiveContainer width="100%" height={200}>
              {insights.supermarketData.length > 0 ? (
                <BarChart
                  data={insights.supermarketData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    axisLine={{ stroke: "currentColor" }}
                    tickLine={{ stroke: "currentColor" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    axisLine={{ stroke: "currentColor" }}
                    tickLine={{ stroke: "currentColor" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBrd}`,
                      borderRadius: "8px",
                      color: tooltipText,
                    }}
                    wrapperStyle={{ zIndex: 9999 }}
                    labelStyle={{ color: tooltipText, fontWeight: 600 }}
                    itemStyle={{ color: tooltipText }}
                    formatter={(value) => [`${Number(value).toLocaleString()}`, "Ahorro estimado"]}
                    labelFormatter={(name) => name}
                    cursor={{ fill: "rgba(0,0,0,0.1)" }}
                  />
                  <Bar dataKey="value" fill={barFill} radius={[4, 4, 0, 0]} maxBarSize={80} />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <div className="text-2xl mb-2">📊</div>
                    <p>No hay datos para mostrar</p>
                  </div>
                </div>
              )}
            </ResponsiveContainer>
          </div>

          {/* Legend with calculation info */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="text-xs text-muted-foreground text-center">
              <p>
                💡 <strong className="text-foreground">Cálculo:</strong> Promedio de compra $50,000 ×
                % descuento
              </p>
              <p className="mt-1">Los ahorros se estiman basándose en un gasto promedio realista</p>

              {/* Debug info */}
              <div className="mt-3 p-2 bg-background/50 rounded border border-border/30">
                <p className="font-medium text-foreground mb-2">📊 Datos del gráfico:</p>
                <div className="space-y-1 text-left">
                  {insights.supermarketData.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-foreground">{item.name}:</span>
                      <span className="font-mono text-foreground">
                        ${item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Total de descuentos procesados: {discounts.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution by payment method (Pie) — con tus estilos */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Distribución por medio de pago</CardTitle>
          <p className="text-sm text-muted-foreground">
            {insights.paymentData.length} medio
            {insights.paymentData.length !== 1 ? "s" : ""} detectado
            {insights.paymentData.length !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={insights.paymentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  label={false}
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
                  formatter={(value: number, name: string) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Simple legend below (tu diseño) */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {insights.paymentData.map((entry, index) => (
                <div key={entry.name} className="flex items-center space-x-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-muted-foreground truncate">{entry.name}</span>
                  <span className="font-medium">({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
