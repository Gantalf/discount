"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FilterBar } from "@/components/filter-bar"
import { ResultsGrid } from "@/components/results-grid"
import { SavingsInsights } from "@/components/savings-insights"
import { RatesPanel } from "@/components/rates-panel"
import { LegalesModal } from "@/components/legales-modal"
import { useDiscounts } from "@/hooks/use-discounts"
import { useFilters } from "@/hooks/use-filters"

export default function HomePage() {
  const { filters, updateFilters, resetFilters } = useFilters()
  const { discounts, loading, error, loadMore, hasMore } = useDiscounts(filters)
  const [selectedLegales, setSelectedLegales] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
        <HeroSection
          onSearch={(query) => updateFilters({ search: query })}
          onWalletSelect={(wallets) => updateFilters({ paymentMethods: wallets })}
        />

        <FilterBar filters={filters} onFiltersChange={updateFilters} onReset={resetFilters} />

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <ResultsGrid
              discounts={discounts}
              loading={loading}
              error={error}
              onLoadMore={loadMore}
              hasMore={hasMore}
              onShowLegales={setSelectedLegales}
            />
          </div>

          <div className="space-y-8">
            <SavingsInsights discounts={discounts} filters={filters} />

            <RatesPanel />
          </div>
        </div>
      </main>

      <LegalesModal legales={selectedLegales} open={!!selectedLegales} onClose={() => setSelectedLegales(null)} />
    </div>
  )
}
