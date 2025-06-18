export interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  type?: "text" | "image"
  imageUrl?: string
}

export interface ChatHistory {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
}
