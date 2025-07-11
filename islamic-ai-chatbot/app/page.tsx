"use client"
import { useState, useEffect } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { ChatHistory } from "@/components/chat-history"
import { EnhancedNavbar } from "@/components/enhanced-navbar"
import { WelcomeSection } from "@/components/welcome-section"
import { useChatStore } from "@/lib/chat-store"
import { cn } from "@/lib/utils"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function Home() {
  const { conversations, currentConversationId } = useChatStore()
  const currentConversation = conversations.find((c) => c.id === currentConversationId)
  const hasMessages = currentConversation && currentConversation.messages.length > 0

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Detect mobile screen size
  useEffect(() => {
    if (!mounted) return

    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Auto-collapse on mobile
      if (mobile) {
        setIsSidebarExpanded(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [mounted])

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded)
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex h-screen w-full bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider open={isSidebarExpanded} onOpenChange={setIsSidebarExpanded}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "relative transition-all duration-300 ease-in-out",
            "flex flex-col",
            // Desktop behavior
            "hidden md:flex",
            isSidebarExpanded ? "w-80" : "w-0",
            // Mobile overlay behavior
            isMobile && isSidebarExpanded && "fixed inset-y-0 left-0 z-50 w-80 shadow-xl md:relative md:shadow-none",
          )}
        >
          {/* Sidebar Content */}
          <div
            className={cn(
              "flex flex-col h-full transition-opacity duration-200 bg-card border-r border-border",
              isSidebarExpanded ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <ChatHistory />
          </div>

          {/* Sidebar Resize Handle */}
          <div
            className={cn(
              "absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-border/50 transition-colors",
              "hidden md:block",
              !isSidebarExpanded && "hidden",
            )}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && isSidebarExpanded && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarExpanded(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Floating Sidebar Toggle for Mobile/Collapsed State */}
          {(!isSidebarExpanded || isMobile) && (
            <div className="absolute top-4 left-4 z-30">
              <button
                onClick={toggleSidebar}
                className={cn(
                  "bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:shadow-xl",
                  "rounded-lg p-2 transition-all duration-200 hover:bg-accent/50",
                  "touch-target-comfortable",
                )}
                aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
              >
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}

          {/* Navbar */}
          <EnhancedNavbar onToggleSidebar={toggleSidebar} isSidebarExpanded={isSidebarExpanded} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!hasMessages && <WelcomeSection />}
            <ChatInterface />
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
