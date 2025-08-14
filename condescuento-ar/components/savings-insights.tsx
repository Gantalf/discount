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
        // Debug individual discount
        console.log("Processing discount:", discount)
        
        // Parse percentage safely
        const percentageStr = discount.descuento.replace("%", "").trim()
        const percentage = parseInt(percentageStr, 10)
        
        console.log("Percentage parsed:", percentageStr, "→", percentage)
        
        // Check if percentage is valid
        if (isNaN(percentage) || percentage <= 0) {
          console.warn("Invalid percentage for discount:", discount.descuento, "→", percentage)
          return acc
        }
        
        // Parse tope safely
        let tope = 50000 // default value
        if (discount.tope) {
          const topeStr = discount.tope.replace(/[^\d]/g, "")
          const topeParsed = parseInt(topeStr, 10)
          if (!isNaN(topeParsed) && topeParsed > 0) {
            tope = topeParsed
          }
        }
        
        console.log("Tope parsed:", discount.tope, "→", tope)
        
        // Use a more realistic average purchase amount of $50,000
        const averagePurchase = 50000
        const estimatedSaving = Math.min(averagePurchase * (percentage / 100), tope * (percentage / 100))
        
        console.log("Estimated saving:", averagePurchase, "*", percentage, "/ 100 =", estimatedSaving)
        
        // Initialize if not exists
        if (!acc[discount.supermarket]) {
          acc[discount.supermarket] = 0
        }
        
        acc[discount.supermarket] += estimatedSaving
        
        console.log("Accumulated for", discount.supermarket, ":", acc[discount.supermarket])
        
        return acc
      },
      {} as Record<string, number>,
    )

    // Debug log
    console.log("Discounts:", discounts)
    console.log("Supermarket savings:", supermarketSavings)
    console.log("Supermarket data:", Object.entries(supermarketSavings).map(([name, value]) => ({ name, value })))
    
    // More specific debug
    console.log("Number of unique supermarkets:", Object.keys(supermarketSavings).length)
    console.log("Supermarket names:", Object.keys(supermarketSavings))
    console.log("Final data for chart:", Object.entries(supermarketSavings).map(([name, value]) => ({ name, value })))
    
    // Debug filtered data
    const filteredData = Object.entries(supermarketSavings)
      .filter(([name, value]) => value !== null && value !== undefined && !isNaN(value) && value > 0)
      .map(([name, value]) => ({ name, value }))
    
    console.log("Filtered data for chart:", filteredData)
    console.log("Data that was filtered out:", Object.entries(supermarketSavings).filter(([name, value]) => 
      value === null || value === undefined || isNaN(value) || value <= 0
    ))

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

      const dayDiscounts = discounts.filter((d) => d.dia && d.dia.some((day) => day.toLowerCase() === dayName.toLowerCase()))

      const dailySavings = dayDiscounts.reduce((sum, discount) => {
        const percentageStr = discount.descuento.replace("%", "").trim()
        const percentage = parseInt(percentageStr, 10)
        
        if (isNaN(percentage) || percentage <= 0) {
          return sum
        }
        
        let tope = 50000
        if (discount.tope) {
          const topeStr = discount.tope.replace(/[^\d]/g, "")
          const topeParsed = parseInt(topeStr, 10)
          if (!isNaN(topeParsed) && topeParsed > 0) {
            tope = topeParsed
          }
        }
        
        const averagePurchase = 50000
        return sum + Math.min(averagePurchase * (percentage / 100), tope * (percentage / 100))
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
      supermarketData: Object.entries(supermarketSavings)
        .filter(([name, value]) => value !== null && value !== undefined && !isNaN(value) && value > 0)
        .map(([name, value]) => ({ name, value })),
      paymentData: Object.entries(paymentDistribution).map(([name, value]) => ({ name, value })),
      projectionData: thirtyDayProjection,
      topOpportunities: discounts
        .sort((a, b) => {
          const aPercentage = parseInt(a.descuento.replace("%", "").trim(), 10) || 0
          const bPercentage = parseInt(b.descuento.replace("%", "").trim(), 10) || 0
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
          <p className="text-sm text-muted-foreground">
            {insights.supermarketData.length} supermercado{insights.supermarketData.length !== 1 ? 's' : ''} con promociones
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
                  /* 👇 que usen el color actual (gris) */
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  /* línea del eje y marcas también grises */
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
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  wrapperStyle={{ zIndex: 9999 }}
                  formatter={(value) => [`${Number(value).toLocaleString()}`, "Ahorro estimado"]}
                  labelFormatter={(name) => name}
                  cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                />

                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--muted-foreground))" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={80}
                />
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
              <p>💡 <strong className="text-foreground">Cálculo:</strong> Promedio de compra $50,000 × % descuento</p>
              <p className="mt-1">Los ahorros se estiman basándose en un gasto promedio realista</p>
              
              {/* Debug info */}
              <div className="mt-3 p-2 bg-background/50 rounded border border-border/30">
                <p className="font-medium text-foreground mb-2">📊 Datos del gráfico:</p>
                <div className="space-y-1 text-left">
                  {insights.supermarketData.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-foreground">{item.name}:</span>
                      <span className="font-mono text-foreground">${item.value.toLocaleString()}</span>
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
    </div>
  );
}
