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

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto relative">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar supermercado, billetera, promoción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg rounded-2xl border-2 border-border/50 focus:border-primary/50 bg-card/50 backdrop-blur-sm"
            />
          </div>

          {/* Typeahead Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-10">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setSearchQuery(suggestion)
                    onSearch(suggestion)
                    setSuggestions([])
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <div className="flex items-center space-x-3">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span>{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>
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
