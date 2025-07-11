"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Mic, MicOff, ImageIcon, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChatStore } from "@/lib/chat-store"
import { useVoiceInput } from "@/hooks/use-voice-input"
import { useImageUpload } from "@/hooks/use-image-upload"
import { queryIslamicAPI } from "@/lib/api"
import { TypingAnimation } from "@/components/typing-animation"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"

export function ChatInterface() {
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const { conversations, currentConversationId, addMessage, createNewConversation, getCurrentConversation } =
    useChatStore()

  const { isListening, startListening, stopListening, transcript } = useVoiceInput()
  const { uploadImage, isUploading, uploadedImage } = useImageUpload()

  const currentConversation = getCurrentConversation()

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [currentConversation?.messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")

    // Create new conversation if none exists
    if (!currentConversationId) {
      createNewConversation()
    }

    // Add user message
    addMessage({
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    })

    setIsLoading(true)

    try {
      const response = await queryIslamicAPI({
        query: userMessage,
        source_type: "auto",
        top_k: 10,
      })

      // Add assistant message
      addMessage({
        role: "assistant",
        content: response.answer,
        timestamp: new Date(),
        references_count: response.references_count,
        processing_time: response.processing_time,
      })
    } catch (error) {
      console.error("Error querying API:", error)
      addMessage({
        role: "assistant",
        content: "I apologize, but I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
      })
      toast.error("Failed to get response. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        await uploadImage(file)
        toast.success("Image uploaded successfully")
      } catch (error) {
        toast.error("Failed to upload image")
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-responsive-xs sm:p-responsive-sm chat-messages">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 container-max-width">
          {currentConversation?.messages.map((message, index) => (
            <div key={index} className={`message-container ${message.role}`}>
              <Card className={`message-bubble ${message.role}`}>
                <div className="space-y-2">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-responsive-xs sm:text-responsive-sm">
                    <ReactMarkdown
                      components={{
                        // Custom components for better styling
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-emerald-500 pl-4 italic my-2">{children}</blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">{children}</pre>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  {message.role === "assistant" && (
                    <div className="flex items-center gap-1 sm:gap-2 pt-2 border-t border-border flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(message.content)}
                        className="h-8 px-2 text-responsive-xs touch-target"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Copy</span>
                        <span className="sm:hidden">📋</span>
                      </Button>
                      {message.references_count && message.references_count > 0 && (
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-responsive-xs touch-target">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">{message.references_count} References</span>
                          <span className="sm:hidden">{message.references_count} 🔗</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="message-container assistant">
              <Card className="message-bubble assistant">
                <TypingAnimation />
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm input-area chat-input-area">
        <div className="max-w-4xl mx-auto w-full container-max-width">
          {uploadedImage && (
            <div className="mb-3 p-2 bg-muted rounded-lg inline-block mx-responsive-sm">
              <img
                src={uploadedImage || "/placeholder.svg"}
                alt="Uploaded"
                className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded"
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="input-container">
            <div className="input-wrapper">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Sab se afzal dua kya hai? or What is the best Dhikr?"
                className="min-h-[48px] sm:min-h-[60px] max-h-32 resize-none pr-16 sm:pr-20 w-full text-responsive-sm"
                disabled={isLoading}
              />

              <div className="input-buttons">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById("image-upload")?.click()}
                  disabled={isUploading}
                  className="touch-target-comfortable p-1"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceToggle}
                  className={`touch-target-comfortable p-1 ${isListening ? "text-red-500" : ""}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0 touch-target-comfortable"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
