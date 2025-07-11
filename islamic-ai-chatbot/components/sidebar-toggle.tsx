"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface SidebarToggleProps {
  className?: string
  variant?: "default" | "floating"
}

export function SidebarToggle({ className, variant = "default" }: SidebarToggleProps) {
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isExpanded = state === "expanded"

  if (variant === "floating") {
    return (
      <Button
        onClick={toggleSidebar}
        variant="outline"
        size="sm"
        className={cn(
          "fixed top-4 left-4 z-40 bg-background/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-200",
          "md:hidden", // Only show on mobile when sidebar is hidden
          className,
        )}
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </Button>
    )
  }

  return (
    <Button
      onClick={toggleSidebar}
      variant="ghost"
      size="sm"
      className={cn("touch-target text-muted-foreground hover:text-foreground transition-colors", className)}
      aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
    >
      {isExpanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      <span className="sr-only">{isExpanded ? "Collapse" : "Expand"} sidebar</span>
    </Button>
  )
}
