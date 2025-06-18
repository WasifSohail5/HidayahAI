"use client"

import { useState, useEffect } from "react"
import type { ChatSession } from "@/components/chat-history"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  sourceType?: string
  referencesCount?: number
  processingTime?: number
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("hidayah-chat-sessions")
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions)
      // Convert timestamp strings back to Date objects
      const sessionsWithDates = parsed.map((session: any) => ({
        ...session,
        timestamp: new Date(session.timestamp),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }))
      setSessions(sessionsWithDates)
    }
  }, [])

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("hidayah-chat-sessions", JSON.stringify(sessions))
    }
  }, [sessions])

  const generateSessionTitle = (firstMessage: string): string => {
    // Extract key Islamic terms or create a meaningful title
    const islamicTerms = [
      "prayer",
      "salah",
      "namaz",
      "quran",
      "hadith",
      "prophet",
      "muhammad",
      "allah",
      "islam",
      "muslim",
      "hajj",
      "ramadan",
      "zakat",
      "fasting",
      "dua",
      "sunnah",
      "halal",
      "haram",
      "jihad",
      "ummah",
    ]

    const words = firstMessage.toLowerCase().split(" ")
    const foundTerms = words.filter((word) => islamicTerms.some((term) => word.includes(term)))

    if (foundTerms.length > 0) {
      return `About ${foundTerms[0].charAt(0).toUpperCase() + foundTerms[0].slice(1)}`
    }

    // Fallback to first few words
    const title = firstMessage.split(" ").slice(0, 4).join(" ")
    return title.length > 30 ? title.substring(0, 30) + "..." : title
  }

  const createNewSession = (firstMessage?: Message): string => {
    const sessionId = Date.now().toString()
    const title = firstMessage ? generateSessionTitle(firstMessage.content) : "New Conversation"

    const newSession: ChatSession = {
      id: sessionId,
      title,
      messages: firstMessage ? [firstMessage] : [],
      timestamp: new Date(),
      isBookmarked: false,
      sourceType: "auto",
      messageCount: firstMessage ? 1 : 0,
    }

    setSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(sessionId)
    return sessionId
  }

  const addMessageToSession = (sessionId: string, message: Message) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          const updatedMessages = [...session.messages, message]
          return {
            ...session,
            messages: updatedMessages,
            messageCount: updatedMessages.length,
            timestamp: new Date(), // Update last activity
            sourceType: message.sourceType || session.sourceType,
          }
        }
        return session
      }),
    )
  }

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId))
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null)
    }
  }

  const toggleBookmark = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, isBookmarked: !session.isBookmarked } : session)),
    )
  }

  const loadSession = (session: ChatSession) => {
    setCurrentSessionId(session.id)
    return session.messages
  }

  const getCurrentSession = (): ChatSession | null => {
    return sessions.find((session) => session.id === currentSessionId) || null
  }

  const clearAllHistory = () => {
    setSessions([])
    setCurrentSessionId(null)
    localStorage.removeItem("hidayah-chat-sessions")
  }

  return {
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
  }
}
