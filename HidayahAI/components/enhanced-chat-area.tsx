"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { Send, Mic, ImageIcon, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "@/lib/types"
import { suggestions } from "@/lib/initial-data"
import EnhancedMessageBubble from "./enhanced-message-bubble"
import SystemLogo from "./system-logo"

interface EnhancedChatAreaProps {
  messages: Message[]
  inputValue: string
  setInputValue: (value: string) => void
  isRecording: boolean
  isTyping: boolean
  onSendMessage: () => void
  onVoiceInput: () => void
  onImageUpload: () => void
  fileInputRef: React.RefObject<HTMLInputElement>
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  setIsMobileMenuOpen: (open: boolean) => void
}

export default function EnhancedChatArea({
  messages,
  inputValue,
  setInputValue,
  isRecording,
  isTyping,
  onSendMessage,
  onVoiceInput,
  onImageUpload,
  fileInputRef,
  handleFileChange,
  setIsMobileMenuOpen,
}: EnhancedChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      {/* Enhanced Chat Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
            <SystemLogo size="sm" />
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Online & Ready</span>
            </div>
          </div>
          <div className="hidden sm:block text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Authentic Islamic Guidance
          </div>
        </div>
      </div>

      {/* Enhanced Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <EnhancedMessageBubble key={message.id} message={message} />
          ))}

          {isTyping && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white text-xs font-semibold shadow-lg">
                AI
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-700 max-w-[80%]">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Enhanced Suggestions */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                Explore Islamic Knowledge
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Ask me about Quran, Hadith, Islamic jurisprudence, and more
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => setInputValue(suggestion)}
                  className="text-sm p-4 h-auto text-left justify-start border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    {suggestion}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Input Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about Islamic teachings, Quran, or Hadith..."
                className="pr-24 py-3 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 rounded-xl shadow-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onImageUpload}
                  className="w-8 h-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <ImageIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onVoiceInput}
                  className={`w-8 h-8 p-0 rounded-lg transition-all duration-200 ${
                    isRecording
                      ? "bg-red-500 text-white shadow-lg animate-pulse"
                      : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={onSendMessage}
              disabled={!inputValue.trim()}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {isRecording && (
            <div className="mt-3 text-sm flex items-center gap-2 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Recording...</span>
              <span>Speak your question about Islam</span>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  )
}
