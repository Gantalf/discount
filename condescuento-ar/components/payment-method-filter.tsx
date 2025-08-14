"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, CreditCard, Search, X } from "lucide-react"

interface PaymentMethodFilterProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

const PAYMENT_METHODS = {
  Billeteras: ["Mercado Pago", "Ualá", "Brubank", "Naranja X", "Personal Pay", "MODO", "Yacaré", "Bimo"],
  Bancos: ["Banco Nación", "Banco Provincia", "Banco Ciudad", "BBVA", "Santander", "Galicia", "Macro", "ICBC"],
  Tarjetas: ["Visa", "Mastercard", "American Express", "Cabal", "Naranja", "Cencosud", "Cordobesa", "Argencard"],
}

export function PaymentMethodFilter({ selected, onChange }: PaymentMethodFilterProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMethods = useMemo(() => {
    if (!searchQuery) return PAYMENT_METHODS

    const filtered: typeof PAYMENT_METHODS = {}
    Object.entries(PAYMENT_METHODS).forEach(([category, methods]) => {
      const matchingMethods = methods.filter((method) => method.toLowerCase().includes(searchQuery.toLowerCase()))
      if (matchingMethods.length > 0) {
        filtered[category] = matchingMethods
      }
    })
    return filtered
  }, [searchQuery])

  const handleToggle = (method: string) => {
    const newSelected = selected.includes(method) ? selected.filter((s) => s !== method) : [...selected, method]
    onChange(newSelected)
  }

  const handleRemove = (method: string) => {
    onChange(selected.filter((s) => s !== method))
  }

  const clearAll = () => {
    onChange([])
  }

  const selectCategory = (category: string) => {
    const categoryMethods = PAYMENT_METHODS[category as keyof typeof PAYMENT_METHODS]
    const allSelected = categoryMethods.every((method) => selected.includes(method))

    if (allSelected) {
      // Deselect all from category
      onChange(selected.filter((method) => !categoryMethods.includes(method)))
    } else {
      // Select all from category
      const newSelected = [...new Set([...selected, ...categoryMethods])]
      onChange(newSelected)
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-transparent"
            role="combobox"
            aria-expanded={open}
          >
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>{selected.length === 0 ? "Métodos de pago" : `${selected.length} seleccionados`}</span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Métodos de pago</h4>
              {selected.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Limpiar
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar método de pago..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categories and Methods */}
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {Object.entries(filteredMethods).map(([category, methods]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-muted-foreground">{category}</h5>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => selectCategory(category)}>
                      {methods.every((method) => selected.includes(method)) ? "Deseleccionar" : "Seleccionar"} todos
                    </Button>
                  </div>

                  <div className="space-y-1">
                    {methods.map((method) => (
                      <div
                        key={method}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => handleToggle(method)}
                      >
                        <Checkbox checked={selected.includes(method)} onChange={() => handleToggle(method)} />
                        <span className="text-sm flex-1">{method}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(filteredMethods).length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">No se encontraron métodos de pago</div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
          {selected.map((method) => (
            <Badge key={method} variant="secondary" className="text-xs px-2 py-1">
              {method}
              <button onClick={() => handleRemove(method)} className="ml-1 hover:bg-destructive/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
