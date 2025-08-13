"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SupermarketFilter } from "@/components/supermarket-filter"
import { PaymentMethodFilter } from "@/components/payment-method-filter"
import { Filter, RotateCcw, Save } from "lucide-react"
import type { Filters } from "@/types/filters"

interface FilterBarProps {
  filters: Filters
  onFiltersChange: (filters: Partial<Filters>) => void
  onReset: () => void
}

export function FilterBar({ filters, onFiltersChange, onReset }: FilterBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const activeFiltersCount = [
    filters.supermarkets?.length || 0,
    filters.paymentMethods?.length || 0,
    filters.search ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 -mx-4 px-4 py-4">
      <div className="space-y-4">
        {/* Mobile Filter Toggle */}
        <div className="flex items-center justify-between md:hidden">
          <Button
            variant="outline"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className={`space-y-4 ${isCollapsed ? "hidden md:block" : ""}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supermarket Filter */}
            <SupermarketFilter
              selected={filters.supermarkets || []}
              onChange={(supermarkets) => onFiltersChange({ supermarkets })}
            />

            {/* Payment Method Filter */}
            <PaymentMethodFilter
              selected={filters.paymentMethods || []}
              onChange={(paymentMethods) => onFiltersChange({ paymentMethods })}
            />

            {/* Sort Filter */}
            <Select value={filters.sort || "discount_desc"} onValueChange={(sort) => onFiltersChange({ sort })}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount_desc">Mayor % descuento</SelectItem>
                <SelectItem value="tope_desc">Mejor tope</SelectItem>
                <SelectItem value="day_asc">Día más cercano</SelectItem>
                <SelectItem value="supermarket_asc">Supermercado A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {activeFiltersCount > 0 && <Badge variant="secondary">{activeFiltersCount} filtros activos</Badge>}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
              <Button variant="ghost" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Guardar preset
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
