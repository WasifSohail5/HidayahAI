"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Mic, Settings, BookOpen, Share2, Bookmark, Moon, Sun, History, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"
import { ChatHistory } from "@/components/chat-history"
import { useChatHistory } from "@/hooks/use-chat-history"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  sourceType?: string
  referencesCount?: number
  processingTime?: number
}

interface AppSettings {
  sourceType: "auto" | "quran" | "hadith" | "both"
  language: "english" | "urdu"
  darkMode: boolean
  voiceEnabled: boolean
}

export default function HidayahAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "السلام علیکم! Welcome to HidayahAI. I am here to help you find guidance through the Quran and authentic Hadith. Ask me any question about Islamic teachings.",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<AppSettings>({
    sourceType: "auto",
    language: "english",
    darkMode: false,
    voiceEnabled: true,
  })
  const [isListening, setIsListening] = useState(false)
  const [bookmarkedMessages, setBookmarkedMessages] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "checking">("checking")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Chat history hook
  const {
    sessions,
    currentSessionId,
    createNewSession,
    addMessageToSession,
    deleteSession,
    toggleBookmark,
    loadSession,
    getCurrentSession,
    clearAllHistory,
    setCurrentSessionId,
  } = useChatHistory()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Check backend connection on component mount
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/health-check", {
          method: "GET",
          cache: "no-store", // Prevent caching of health check
        })

        if (response.ok) {
          const data = await response.json()
          setConnectionStatus(data.status === "connected" ? "connected" : "disconnected")
        } else {
          setConnectionStatus("disconnected")
        }
      } catch (error) {
        // Silently handle connection errors - they're expected when backend is not running
        setConnectionStatus("disconnected")
      }
    }

    checkConnection()

    // Set up periodic health checks every 30 seconds
    const healthCheckInterval = setInterval(checkConnection, 30000)

    return () => clearInterval(healthCheckInterval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    // Handle session management
    let sessionId = currentSessionId
    if (!sessionId) {
      sessionId = createNewSession(userMessage)
    } else {
      addMessageToSession(sessionId, userMessage)
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: userMessage.content,
          source_type: settings.sourceType,
          top_k: 10,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.answer,
        timestamp: new Date(),
        sourceType: data.source_type,
        referencesCount: data.references_count,
        processingTime: data.processing_time,
      }

      setMessages((prev) => [...prev, aiMessage])

      // Add AI message to session
      if (sessionId) {
        addMessageToSession(sessionId, aiMessage)
      }

      // Update connection status on successful response
      setConnectionStatus("connected")
    } catch (error) {
      console.error("Request failed:", error)

      // The API route handles fallback, so we should still get a response
      try {
        const response = await fetch("/api/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: userMessage.content,
            source_type: settings.sourceType,
            top_k: 10,
          }),
        })

        const data = await response.json()
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: data.answer,
          timestamp: new Date(),
          sourceType: data.source_type,
          referencesCount: data.references_count,
          processingTime: data.processing_time,
        }
        setMessages((prev) => [...prev, aiMessage])

        // Add AI message to session
        if (sessionId) {
          addMessageToSession(sessionId, aiMessage)
        }

        // Mark as disconnected since we're using mock responses
        setConnectionStatus("disconnected")
      } catch (fallbackError) {
        toast({
          title: "Error",
          description: "Unable to process your request. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const startVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast({
        title: "Voice not supported",
        description: "Voice input is not supported in your browser.",
        variant: "destructive",
      })
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = settings.language === "urdu" ? "ur-PK" : "en-US"

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputValue(transcript)
    }
    recognition.onerror = () => {
      toast({
        title: "Voice input error",
        description: "Could not capture voice input. Please try again.",
        variant: "destructive",
      })
      setIsListening(false)
    }

    recognition.start()
  }

  const toggleMessageBookmark = (messageId: string) => {
    setBookmarkedMessages((prev) =>
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId],
    )
  }

  const shareMessage = async (message: Message) => {
    try {
      await navigator.share({
        title: "HidayahAI Response",
        text: message.content,
        url: window.location.href,
      })
    } catch (error) {
      navigator.clipboard.writeText(message.content)
      toast({
        title: "Copied to clipboard",
        description: "Message copied to clipboard successfully.",
      })
    }
  }

  const formatMessageContent = (content: string) => {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s)]+)/g
    return content.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-emerald-600 hover:text-emerald-700 underline">$1</a>',
    )
  }

  const handleNewChat = () => {
    setMessages([
      {
        id: "1",
        type: "ai",
        content:
          "السلام علیکم! Welcome to HidayahAI. I am here to help you find guidance through the Quran and authentic Hadith. Ask me any question about Islamic teachings.",
        timestamp: new Date(),
      },
    ])
    setCurrentSessionId(null)
    setSidebarOpen(false)
  }

  const handleSessionSelect = (session: any) => {
    const sessionMessages = loadSession(session)
    setMessages(
      sessionMessages.length > 0
        ? sessionMessages
        : [
            {
              id: "1",
              type: "ai",
              content:
                "السلام علیکم! Welcome to HidayahAI. I am here to help you find guidance through the Quran and authentic Hadith. Ask me any question about Islamic teachings.",
              timestamp: new Date(),
            },
          ],
    )
    setSidebarOpen(false)
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Backend Connected"
      case "disconnected":
        return "Demo Mode (Backend Offline)"
      case "checking":
        return "Checking Connection..."
      default:
        return "Unknown Status"
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${settings.darkMode ? "dark bg-slate-900" : "bg-gradient-to-br from-indigo-50 via-white to-emerald-50"}`}
    >
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 islamic-pattern animate-pulse"></div>
      </div>

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="hidden lg:block w-80 border-r border-emerald-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <ChatHistory
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSessionSelect={handleSessionSelect}
            onSessionDelete={deleteSession}
            onSessionBookmark={toggleBookmark}
            onNewChat={handleNewChat}
          />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <ChatHistory
              sessions={sessions}
              currentSessionId={currentSessionId}
              onSessionSelect={handleSessionSelect}
              onSessionDelete={deleteSession}
              onSessionBookmark={toggleBookmark}
              onNewChat={handleNewChat}
            />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-emerald-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>

              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  HidayahAI
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Divine Guidance through Quran and Authentic Hadith
                  </p>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === "connected"
                        ? "bg-green-500"
                        : connectionStatus === "disconnected"
                          ? "bg-amber-500"
                          : "bg-yellow-500 animate-pulse"
                    }`}
                    title={getConnectionStatusText()}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="lg:hidden">
                <History className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }))}
              >
                {settings.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Settings</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Source Type</label>
                      <Select
                        value={settings.sourceType}
                        onValueChange={(value: any) => setSettings((prev) => ({ ...prev, sourceType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto Detect</SelectItem>
                          <SelectItem value="both">Quran & Hadith</SelectItem>
                          <SelectItem value="quran">Quran Only</SelectItem>
                          <SelectItem value="hadith">Hadith Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Language</label>
                      <Select
                        value={settings.language}
                        onValueChange={(value: any) => setSettings((prev) => ({ ...prev, language: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="urdu">اردو</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Voice Input</label>
                      <Switch
                        checked={settings.voiceEnabled}
                        onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, voiceEnabled: checked }))}
                      />
                    </div>

                    {/* Connection Status in Settings */}
                    <div className="pt-4 border-t">
                      <label className="text-sm font-medium mb-2 block">Backend Status</label>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            connectionStatus === "connected"
                              ? "bg-green-500"
                              : connectionStatus === "disconnected"
                                ? "bg-amber-500"
                                : "bg-yellow-500 animate-pulse"
                          }`}
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400">{getConnectionStatusText()}</span>
                      </div>
                      {connectionStatus === "disconnected" && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Start your FastAPI server at localhost:8000 to enable real responses
                        </p>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </header>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <Card
                    className={`max-w-[80%] p-4 ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                        : "bg-white dark:bg-slate-800 border-emerald-100 dark:border-slate-700"
                    }`}
                  >
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                    />

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-100 dark:border-slate-700">
                      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {message.sourceType && (
                          <Badge variant="secondary" className="text-xs">
                            {message.sourceType}
                          </Badge>
                        )}
                        {message.referencesCount && (
                          <Badge variant="outline" className="text-xs">
                            {message.referencesCount} refs
                          </Badge>
                        )}
                      </div>

                      {message.type === "ai" && (
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMessageBookmark(message.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Bookmark
                              className={`w-3 h-3 ${
                                bookmarkedMessages.includes(message.id) ? "fill-current text-yellow-500" : ""
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => shareMessage(message)}
                            className="h-6 w-6 p-0"
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <Card className="max-w-[80%] p-4 bg-white dark:bg-slate-800">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Seeking guidance...</span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-emerald-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about Islamic teachings..."
                    className="min-h-[50px] max-h-32 resize-none pr-12 border-emerald-200 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />
                  {settings.voiceEnabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={startVoiceInput}
                      disabled={isListening}
                      className="absolute right-2 top-2 h-8 w-8 p-0"
                    >
                      <Mic className={`w-4 h-4 ${isListening ? "text-red-500 animate-pulse" : ""}`} />
                    </Button>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 h-[50px] px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
