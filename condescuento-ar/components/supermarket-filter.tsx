"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, Store, X } from "lucide-react"

interface SupermarketFilterProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

const SUPERMARKETS = [
  { name: "Carrefour", logo: "/carrefour-logo.png" },
  { name: "Día", logo: "/dia-supermarket-logo.png" },
  { name: "Coto", logo: "/generic-leaf-logo.png" },
  { name: "Jumbo", logo: null },
  { name: "Cordiez", logo: null },
  { name: "Vea", logo: null },
  { name: "Disco", logo: null },
  { name: "La Anónima", logo: null },
]

export function SupermarketFilter({ selected, onChange }: SupermarketFilterProps) {
  const [open, setOpen] = useState(false)

  const handleToggle = (supermarket: string) => {
    const newSelected = selected.includes(supermarket)
      ? selected.filter((s) => s !== supermarket)
      : [...selected, supermarket]
    onChange(newSelected)
  }

  const handleRemove = (supermarket: string) => {
    onChange(selected.filter((s) => s !== supermarket))
  }

  const clearAll = () => {
    onChange([])
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
              <Store className="h-4 w-4" />
              <span>{selected.length === 0 ? "Supermercados" : `${selected.length} seleccionados`}</span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Seleccionar supermercados</h4>
              {selected.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Limpiar
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {SUPERMARKETS.map((supermarket) => (
                <div
                  key={supermarket.name}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleToggle(supermarket.name)}
                >
                  <Checkbox
                    checked={selected.includes(supermarket.name)}
                    onChange={() => handleToggle(supermarket.name)}
                  />

                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                    {supermarket.logo ? (
                      <img
                        src={supermarket.logo || "/placeholder.svg"}
                        alt={supermarket.name}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <span className="text-xs font-bold">{supermarket.name.slice(0, 2)}</span>
                    )}
                  </div>

                  <span className="text-sm font-medium flex-1">{supermarket.name}</span>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 overflow-x-hidden">
          {selected.map((supermarket) => (
            <Badge key={supermarket} variant="secondary" className="text-xs px-2 py-1 flex-shrink-0">
              <span className="truncate max-w-24">{supermarket}</span>
              <button
                onClick={() => handleRemove(supermarket)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
