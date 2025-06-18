"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { Send, Mic, ImageIcon, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Message } from "@/lib/types"
import { suggestions } from "@/lib/initial-data"
import MessageBubble from "./message-bubble"
import Logo from "./logo"

interface ChatAreaProps {
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

export default function ChatArea({
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
}: ChatAreaProps) {
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
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <Logo size="sm" />
          <div className="hidden sm:block text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
            Online
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs">
                AI
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 max-w-[80%]">
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

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-3xl mx-auto">
            <p className="text-sm mb-3 text-slate-600 dark:text-slate-400">Try asking about:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue(suggestion)}
                  className="text-xs border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900 text-slate-700 dark:text-slate-300"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about Islamic teachings, Quran, or Hadith..."
                className="pr-20 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onImageUpload}
                  className="w-8 h-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <ImageIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onVoiceInput}
                  className={`w-8 h-8 p-0 rounded-full ${
                    isRecording
                      ? "bg-red-500 text-white"
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {isRecording && (
            <div className="mt-2 text-sm flex items-center gap-2 text-red-500 dark:text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Recording... Speak your question
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  )
}
