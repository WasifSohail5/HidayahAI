"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChatHistory } from "@/components/chat-history"

interface SidebarLayoutProps {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      // Auto-collapse on mobile
      if (window.innerWidth < 768) {
        setIsExpanded(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "relative transition-all duration-300 ease-in-out border-r border-border bg-card/50 backdrop-blur-sm",
          "flex flex-col",
          // Desktop behavior
          "hidden md:flex",
          isExpanded ? "w-80" : "w-0",
          // Mobile overlay behavior
          isMobile && isExpanded && "fixed inset-y-0 left-0 z-50 w-80 shadow-xl md:relative md:shadow-none",
        )}
      >
        {/* Sidebar Content */}
        <div
          className={cn(
            "flex flex-col h-full transition-opacity duration-200",
            isExpanded ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <ChatHistory />
        </div>

        {/* Sidebar Resize Handle */}
        <div
          className={cn(
            "absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-border/50 transition-colors",
            "hidden md:block",
            !isExpanded && "hidden",
          )}
          onMouseDown={(e) => {
            e.preventDefault()
            // Implement resize functionality if needed
          }}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out", "relative")}>
        {/* Sidebar Toggle Button */}
        <div className="absolute top-4 left-4 z-30">
          <Button
            onClick={toggleSidebar}
            variant="outline"
            size="sm"
            className={cn(
              "bg-background/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-200",
              "touch-target-comfortable",
              // Show on mobile or when sidebar is collapsed
              "md:hidden",
              !isExpanded && "md:flex",
            )}
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
        </div>

        {/* Desktop Sidebar Toggle in Navbar */}
        <div className="hidden md:block">{children}</div>

        {/* Mobile Content */}
        <div className="md:hidden">{children}</div>
      </div>
    </div>
  )
}
