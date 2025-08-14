"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, FileText, Sparkles, Clock } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || ""

interface LegalesModalProps {
  legales: string | null
  open: boolean
  onClose: () => void
}

export function LegalesModal({ legales, open, onClose }: LegalesModalProps) {
  const [summary, setSummary] = useState<string>("")
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [showFullText, setShowFullText] = useState(false)

  const isUrl = legales?.startsWith("http")

  useEffect(() => {
    if (open && legales && !isUrl) {
      // Reset state when modal opens
      setSummary("")
      setShowFullText(false)
    }
  }, [open, legales, isUrl])

  const generateSummary = async () => {
    if (!legales || isUrl) return

    setLoadingSummary(true)
    try {
      const res = await fetch(`${API_BASE}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: legales }),
      })
      const data = await res.json()
      setSummary(data.summary || "")
    } catch (error) {
      setSummary("Error al generar resumen automático")
    } finally {
      setLoadingSummary(false)
    }
  }

  if (!legales) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Términos y Condiciones</span>
          </DialogTitle>
          <DialogDescription>Información legal de la promoción</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isUrl ? (
            // URL case - show link and preview
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Enlace externo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Los términos y condiciones están disponibles en el sitio web oficial.
                </p>
                <Button asChild className="w-full">
                  <a href={legales} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir términos y condiciones
                  </a>
                </Button>
              </div>

              <div className="p-4 bg-card border border-border/50 rounded-lg">
                <h4 className="font-medium mb-2">Vista previa</h4>
                <p className="text-sm text-muted-foreground">
                  Esta promoción está sujeta a términos y condiciones específicos del supermercado. Te recomendamos
                  revisar la información completa antes de realizar tu compra.
                </p>
              </div>
            </div>
          ) : (
            // Text case - show full text and AI summary option
            <div className="space-y-4">
              {/* AI Summary Section */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Resumen automático</span>
                    <Badge variant="secondary" className="text-xs">
                      IA
                    </Badge>
                  </div>

                  {!summary && !loadingSummary && (
                    <Button size="sm" variant="outline" onClick={generateSummary}>
                      Generar resumen
                    </Button>
                  )}
                </div>

                {loadingSummary && (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                )}

                {summary && <p className="text-sm leading-relaxed">{summary}</p>}

                {!summary && !loadingSummary && (
                  <p className="text-sm text-muted-foreground">
                    Genera un resumen automático de los términos y condiciones
                  </p>
                )}
              </div>

              {/* Full Text Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Texto completo</h4>
                  <Button variant="ghost" size="sm" onClick={() => setShowFullText(!showFullText)}>
                    {showFullText ? "Ocultar" : "Mostrar"} texto completo
                  </Button>
                </div>

                {showFullText && (
                  <div className="p-4 bg-muted/50 rounded-lg max-h-60 overflow-y-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{legales}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Última actualización: Hoy</span>
            </div>

            <p className="text-xs text-muted-foreground">Información sujeta a cambios sin previo aviso</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
