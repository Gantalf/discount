"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Copy, ExternalLink, Calendar, MapPin, CreditCard, Percent } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Discount } from "@/types/filters"

interface ResultsGridProps {
  discounts: Discount[]
  loading: boolean
  error: string | null
  onLoadMore: () => void
  hasMore: boolean
  onShowLegales: (legales: string) => void
}

export function ResultsGrid({ discounts, loading, error, onLoadMore, hasMore, onShowLegales }: ResultsGridProps) {
  const { toast } = useToast()
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const observerRef = useRef<HTMLDivElement>(null)

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  const copyConditions = (discount: Discount) => {
    const text = `${discount.supermarket} - ${discount.descuento} con ${discount.medio_pago}\n${discount.detalles}\nTope: ${discount.tope || "Sin tope"}`
    navigator.clipboard.writeText(text)
    toast({
      title: "Condiciones copiadas",
      description: "Las condiciones se copiaron al portapapeles",
    })
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">Error al cargar descuentos</div>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    )
  }

  if (!loading && discounts.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-6xl">🔍</div>
        <h3 className="text-xl font-semibold">No encontramos promos con esos filtros</h3>
        <p className="text-muted-foreground">Prueba ampliar el día o quitar un método de pago</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Descuentos disponibles</h2>
        <Badge variant="secondary">{discounts.length} resultados</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discounts.map((discount) => (
          <Card
            key={discount.id}
            className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm"
            onClick={() => setExpandedCard(expandedCard === discount.id ? null : discount.id)}
          >
            <CardContent className="p-6 space-y-4">
              {/* Header with logos and discount */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    {discount.logo_supermarket ? (
                      <img
                        src={discount.logo_supermarket || "/placeholder.svg"}
                        alt={discount.supermarket}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <span className="text-xs font-bold">{discount.supermarket.slice(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{discount.supermarket}</h3>
                    <p className="text-xs text-muted-foreground">{discount.medio_pago}</p>
                  </div>
                </div>

                <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                  <Percent className="w-3 h-3 mr-1" />
                  {discount.descuento}
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <p className="text-sm font-medium">{discount.detalles}</p>

                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Detalles</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{discount.aplica_en}</span>
                  </div>
                </div>

                {discount.tope && (
                  <div className="flex items-center space-x-1 text-xs">
                    <CreditCard className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Tope:</span>
                    <span className="font-medium">{discount.tope}</span>
                  </div>
                )}
              </div>

              {/* Expanded content */}
              {expandedCard === discount.id && (
                <div className="pt-4 border-t border-border/50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyConditions(discount)
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar condiciones
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onShowLegales(discount.legales)
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver legales
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Loading skeletons */}
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={`skeleton-${i}`} className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex space-x-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-4" />

      {/* Load more button (fallback) */}
      {hasMore && !loading && (
        <div className="text-center">
          <Button onClick={onLoadMore} variant="outline">
            Cargar más descuentos
          </Button>
        </div>
      )}
    </div>
  )
}
