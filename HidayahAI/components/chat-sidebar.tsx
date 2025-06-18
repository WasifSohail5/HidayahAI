"use client"
import { PlusCircle, MessageSquare, X, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatHistory } from "@/lib/types"
import Logo from "./logo"
import ThemeToggle from "./theme-toggle"

interface ChatSidebarProps {
  chatHistory: ChatHistory[]
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export default function ChatSidebar({
  chatHistory,
  onNewChat,
  onSelectChat,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: ChatSidebarProps) {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-slate-800 shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-slate-600 dark:text-slate-300" />
        ) : (
          <Menu className="h-6 w-6 text-slate-600 dark:text-slate-300" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`w-80 border-r transition-all duration-300 flex flex-col
          bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700
          ${isMobileMenuOpen ? "fixed inset-y-0 left-0 z-40" : "hidden md:flex"}`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <div className="p-4">
          <Button
            onClick={onNewChat}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-2 py-2">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 px-2">Recent Conversations</h3>
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className="w-full text-left p-3 rounded-lg transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5" />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">{chat.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{chat.lastMessage}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatDate(chat.timestamp)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-center text-slate-500 dark:text-slate-400">
            HidayahAI © {new Date().getFullYear()} <br />
            <span className="text-emerald-600 dark:text-emerald-400">Islamic Truth Verifier</span>
          </div>
        </div>
      </div>
    </>
  )
}
