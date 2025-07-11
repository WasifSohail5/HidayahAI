"use client"

import { Moon, Sun, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { SidebarToggle } from "@/components/sidebar-toggle"
import { useState } from "react"
import { SettingsPanel } from "@/components/settings-panel"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm w-full">
        <div className="flex items-center justify-between p-responsive-sm w-full min-h-[60px]">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* Enhanced Sidebar Toggle */}
            <SidebarToggle className="mr-1" />

            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <span className="text-xl sm:text-2xl flex-shrink-0">🕌</span>
              <h1 className="text-responsive-lg sm:text-responsive-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-600 bg-clip-text text-transparent truncate navbar-title">
                <span className="hidden sm:inline">Islamic Assistant</span>
                <span className="sm:hidden">Islamic AI</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="text-muted-foreground hover:text-foreground touch-target text-responsive-xs sm:text-responsive-sm"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">⚙️</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground touch-target"
            >
              {theme === "dark" ? (
                <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </div>
      </nav>

      {/* Floating toggle for mobile when sidebar is collapsed */}
      <SidebarToggle variant="floating" />

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
