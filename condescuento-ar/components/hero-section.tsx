"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Wallet, X } from "lucide-react"

interface HeroSectionProps {
  onSearch: (query: string) => void
  onWalletSelect: (wallets: string[]) => void
}

const POPULAR_WALLETS = ["Mercado Pago", "Ualá", "Brubank", "Naranja X", "Personal Pay"]

export function HeroSection({ onSearch, onWalletSelect }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWallets, setSelectedWallets] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Mock typeahead suggestions
  useEffect(() => {
    if (searchQuery.length > 1) {
      const mockSuggestions = [
        "Carrefour 20% descuento",
        "Día miércoles de descuentos",
        "Coto con Mercado Pago",
        "Jumbo tarjeta Naranja",
      ].filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
      setSuggestions(mockSuggestions)
    } else {
      setSuggestions([])
    }
  }, [searchQuery])

  const handleWalletToggle = (wallet: string) => {
    const newWallets = selectedWallets.includes(wallet)
      ? selectedWallets.filter((w) => w !== wallet)
      : [...selectedWallets, wallet]

    setSelectedWallets(newWallets)
    onWalletSelect(newWallets)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
    setSuggestions([])
  }

  return (
    <section className="text-center space-y-8 py-12">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          condescuento.ar
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          Todos los descuentos, en un solo lugar.
        </p>
      </div>


      {/* Quick Wallet Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Wallet className="h-4 w-4" />
          <span>Usar mis billeteras:</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {POPULAR_WALLETS.map((wallet) => (
            <Badge
              key={wallet}
              variant={selectedWallets.includes(wallet) ? "default" : "secondary"}
              className="cursor-pointer px-4 py-2 text-sm hover:scale-105 transition-all duration-200"
              onClick={() => handleWalletToggle(wallet)}
            >
              {wallet}
              {selectedWallets.includes(wallet) && <X className="ml-2 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  )
}
