import type { Message, ChatHistory } from "./types"

export const initialMessages: Message[] = [
  {
    id: "welcome",
    content:
      "Assalamu Alaikum! I am HidayahAI, your Islamic Truth Verifier. I can help you find authentic information from the Quran and Hadith. How may I assist you today?",
    sender: "bot",
    timestamp: new Date(),
  },
]

export const initialChatHistory: ChatHistory[] = [
  {
    id: "zakat",
    title: "Zakat Calculation",
    lastMessage: "What is the nisab for Zakat?",
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    id: "prayer",
    title: "Prayer Times",
    lastMessage: "When should I pray Maghrib?",
    timestamp: new Date(Date.now() - 172800000), // 2 days ago
  },
  {
    id: "halal",
    title: "Halal Food Guidelines",
    lastMessage: "Is seafood halal in Islam?",
    timestamp: new Date(Date.now() - 259200000), // 3 days ago
  },
  {
    id: "ramadan",
    title: "Ramadan Fasting",
    lastMessage: "What breaks the fast?",
    timestamp: new Date(Date.now() - 345600000), // 4 days ago
  },
]

export const suggestions = [
  "Ask about Zakat calculation",
  "What is the Islamic ruling on interest?",
  "Explain the five pillars of Islam",
  "How to perform Wudu correctly?",
  "What are the conditions for Hajj?",
  "Islamic guidelines for marriage",
]
