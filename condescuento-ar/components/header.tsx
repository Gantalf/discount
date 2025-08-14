"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Moon, Sun, Globe, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"

export function Header() {
  const { theme, setTheme } = useTheme()
  const [language, setLanguage] = useState("ES")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">condescuento.ar</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Todos los descuentos en un lugar</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    Inicio
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    Acerca de
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "ES" ? "EN" : "ES")}
              className="w-12 h-9 p-0 text-xs font-medium"
            >
              <Globe className="h-3 w-3 mr-1" />
              {language}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden w-9 h-9 p-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 py-4 space-y-4">
            <nav className="space-y-2">
              <a href="#" className="block text-sm font-medium text-foreground hover:text-primary transition-colors">
                Inicio
              </a>
              <a
                href="#"
                className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Tasas de Ahorro
              </a>
              <a
                href="#"
                className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Acerca de
              </a>
            </nav>

            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="w-9 h-9 p-0"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLanguage(language === "ES" ? "EN" : "ES")}
                  className="w-12 h-9 p-0 text-xs font-medium"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  {language}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
