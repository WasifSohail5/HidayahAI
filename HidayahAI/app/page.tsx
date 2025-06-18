"use client"

import type React from "react"

import { useState, useRef } from "react"
import EnhancedSidebar from "@/components/enhanced-sidebar"
import EnhancedChatArea from "@/components/enhanced-chat-area"
import { ThemeProvider } from "@/components/theme-provider"
import type { Message, ChatHistory } from "@/lib/types"
import { initialMessages, initialChatHistory } from "@/lib/initial-data"

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>(initialChatHistory)
  const [inputValue, setInputValue] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Add to chat history if it's a new conversation
    if (messages.length <= 1) {
      const newChat: ChatHistory = {
        id: Date.now().toString(),
        title: inputValue.length > 30 ? `${inputValue.substring(0, 30)}...` : inputValue,
        lastMessage: inputValue,
        timestamp: new Date(),
      }
      setChatHistory((prev) => [newChat, ...prev])
    } else {
      // Update last message in existing chat
      setChatHistory((prev) => [
        {
          ...prev[0],
          lastMessage: inputValue,
          timestamp: new Date(),
        },
        ...prev.slice(1),
      ])
    }

    // Simulate bot response with enhanced Islamic content
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getEnhancedBotResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }

  const getEnhancedBotResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes("zakat")) {
      return `According to Islamic teachings, Zakat is one of the Five Pillars of Islam and a fundamental act of worship.

**Key Points about Zakat:**
• The nisab (minimum threshold) for gold is 87.48 grams
• For silver, the nisab is 612.36 grams  
• The rate is 2.5% of your savings held for one lunar year
• It purifies wealth and helps the needy

**Quranic Reference:**
"And establish prayer and give zakat and bow with those who bow [in worship and obedience]." - Surah Al-Baqarah, Ayah 43

May Allah accept your Zakat and bless your wealth. If you need help calculating your Zakat, I can guide you through the process.`
    } else if (lowerQuery.includes("prayer") || lowerQuery.includes("salah")) {
      return `Prayer (Salah) is the second pillar of Islam and the direct connection between a believer and Allah.

**The Five Daily Prayers:**
• Fajr (Dawn) - 2 Rak'ahs
• Dhuhr (Midday) - 4 Rak'ahs  
• Asr (Afternoon) - 4 Rak'ahs
• Maghrib (Sunset) - 3 Rak'ahs
• Isha (Night) - 4 Rak'ahs

**Hadith Reference:**
The Prophet Muhammad (ﷺ) said: "The key to Paradise is prayer, and the key to prayer is wudu (ablution)." - Reported by Ahmad

Each prayer has specific times and requirements as outlined in the Quran and Sunnah. Would you like to know about the conditions for valid prayer or prayer times?`
    } else if (lowerQuery.includes("interest") || lowerQuery.includes("riba")) {
      return `Interest (Riba) is strictly prohibited in Islam and is considered one of the major sins.

**Quranic Prohibition:**
"Those who consume interest cannot stand [on the Day of Resurrection] except as one stands who is being beaten by Satan into insanity." - Surah Al-Baqarah, Ayah 275

**Hadith Reference:**
The Prophet Muhammad (ﷺ) cursed the one who consumes riba, the one who gives it, the one who records it, and the two witnesses to it, saying: "They are all the same." - Sahih Muslim

**Islamic Alternatives:**
• Murabaha (cost-plus financing)
• Musharakah (partnership)
• Ijarah (leasing)
• Sukuk (Islamic bonds)

Islam encourages trade and business while prohibiting exploitation through interest.`
    } else if (lowerQuery.includes("halal") || lowerQuery.includes("haram")) {
      return `In Islam, halal refers to what is permissible, while haram refers to what is forbidden by Allah.

**Hadith Guidance:**
The Prophet Muhammad (ﷺ) said: "The halal is clear and the haram is clear, and between them are matters that are doubtful which many people do not know." - Sahih Bukhari and Muslim

**General Principles:**
• Everything is halal unless specifically prohibited
• Avoid doubtful matters to protect your faith
• Intention (niyyah) matters in determining permissibility
• Necessity can make prohibited things permissible in extreme cases

**Common Categories:**
• Food and drink regulations
• Business and financial transactions  
• Social interactions and relationships
• Worship and religious practices

Would you like specific guidance on any particular aspect of halal and haram?`
    } else {
      return `Assalamu Alaikum! Thank you for your question. I strive to provide authentic Islamic guidance based on the Quran and Sunnah.

I can help you with:
• Quranic verses and their interpretations
• Authentic Hadith references
• Islamic jurisprudence (Fiqh)
• The Five Pillars of Islam
• Islamic ethics and morality
• Halal and Haram rulings

Could you please be more specific about what you'd like to know? I'm here to help you find the truth in Islamic teachings with proper references from authentic sources.

Barakallahu feeki (May Allah bless you)! 🤲`
    }
  }

  const handleVoiceInput = () => {
    setIsRecording(!isRecording)

    if (!isRecording) {
      // Simulate voice recording with Islamic phrases
      const voiceQueries = [
        "What are the conditions for valid prayer in Islam?",
        "Tell me about the importance of charity in Islam",
        "How should a Muslim conduct business ethically?",
        "What does the Quran say about patience and perseverance?",
      ]

      setTimeout(() => {
        const randomQuery = voiceQueries[Math.floor(Math.random() * voiceQueries.length)]
        setInputValue(randomQuery)
        setIsRecording(false)
      }, 2000)
    }
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      const imageMessage: Message = {
        id: Date.now().toString(),
        content: "I've uploaded an image for you to analyze from an Islamic perspective.",
        sender: "user",
        timestamp: new Date(),
        type: "image",
        imageUrl: imageUrl,
      }
      setMessages((prev) => [...prev, imageMessage])

      // Simulate bot response to image
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: `I can see the image you've shared. While I can view images, I specialize in providing guidance based on Islamic texts.

If you have questions about what you see in the image from an Islamic perspective, please describe it and I'll be happy to help based on:
• Quranic teachings
• Authentic Hadith
• Islamic jurisprudence
• Islamic ethics and values

For example, if it's about food, I can discuss halal guidelines. If it's about behavior or situations, I can provide Islamic moral guidance.

How can I help you understand this from an Islamic viewpoint?`,
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botResponse])
      }, 1500)
    }
  }

  const handleNewChat = () => {
    setMessages(initialMessages.slice(0, 1)) // Keep only the welcome message
  }

  const loadChatHistory = (chatId: string) => {
    // In a real app, this would load the actual chat
    const selectedChat = chatHistory.find((chat) => chat.id === chatId)
    if (selectedChat) {
      setMessages([
        initialMessages[0],
        {
          id: "history-1",
          content: selectedChat.title,
          sender: "user",
          timestamp: new Date(Date.now() - 60000),
        },
        {
          id: "history-2",
          content: `Here is authentic Islamic guidance about "${selectedChat.title}" based on Quran and Sunnah...`,
          sender: "bot",
          timestamp: new Date(Date.now() - 30000),
        },
      ])
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <EnhancedSidebar
          chatHistory={chatHistory}
          onNewChat={handleNewChat}
          onSelectChat={loadChatHistory}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <EnhancedChatArea
          messages={messages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          isRecording={isRecording}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          onVoiceInput={handleVoiceInput}
          onImageUpload={handleImageUpload}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      </div>
    </ThemeProvider>
  )
}
