"use client"

import { useState } from "react"
import { PlusCircle, MessageSquare, X, Menu, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatHistory } from "@/lib/types"
import SystemLogo from "./system-logo"
import ThemeToggle from "./theme-toggle"

interface EnhancedSidebarProps {
  chatHistory: ChatHistory[]
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export default function EnhancedSidebar({
  chatHistory,
  onNewChat,
  onSelectChat,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: EnhancedSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        ) : (
          <Menu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`border-r transition-all duration-300 flex flex-col relative
          bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 
          border-slate-200 dark:border-slate-700
          ${isCollapsed ? "w-16" : "w-80"}
          ${isMobileMenuOpen ? "fixed inset-y-0 left-0 z-40 w-80" : "hidden md:flex"}`}
      >
        {/* Collapse Toggle Button - Desktop Only */}
        <button
          className="hidden md:flex absolute -right-3 top-6 z-10 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center shadow-md hover:shadow-lg transition-all duration-200"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* Header with New Logo */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <SystemLogo
              size={isCollapsed ? "sm" : "md"}
              showText={!isCollapsed}
              variant={isCollapsed ? "icon-only" : "full"}
            />
            {!isCollapsed && <ThemeToggle />}
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={onNewChat}
            className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200 ${
              isCollapsed ? "px-2" : "px-4"
            }`}
            size={isCollapsed ? "icon" : "default"}
          >
            <PlusCircle className={`h-4 w-4 ${isCollapsed ? "" : "mr-2"}`} />
            {!isCollapsed && "New Chat"}
          </Button>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-2">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-2 uppercase tracking-wider">
                Recent Conversations
              </h3>
            )}
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 group relative ${
                  isCollapsed ? "flex justify-center" : ""
                }`}
                title={isCollapsed ? chat.title : undefined}
              >
                {isCollapsed ? (
                  <MessageSquare className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                ) : (
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                        {chat.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{chat.lastMessage}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDate(chat.timestamp)}</p>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          {isCollapsed ? (
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-center text-slate-500 dark:text-slate-400">
                <div className="font-medium text-emerald-600 dark:text-emerald-400">HidayahAI</div>
                <div>© {new Date().getFullYear()} Islamic Truth Verifier</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
