import { Clock } from "lucide-react"
import type { Message } from "@/lib/types"

interface EnhancedMessageBubbleProps {
  message: Message
}

export default function EnhancedMessageBubble({ message }: EnhancedMessageBubbleProps) {
  const isUser = message.sender === "user"
  const formattedTime = message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <div className={`flex items-start gap-4 ${isUser ? "flex-row-reverse" : ""} animate-fade-in`}>
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg ${
          isUser
            ? "bg-gradient-to-br from-slate-600 to-slate-700"
            : "bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700"
        }`}
      >
        {isUser ? "You" : "AI"}
      </div>

      {/* Message Content */}
      <div className={`max-w-[75%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl p-4 shadow-lg transition-all duration-200 hover:shadow-xl ${
            isUser
              ? "bg-gradient-to-br from-emerald-600 to-teal-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
          }`}
        >
          {message.type === "image" && message.imageUrl && (
            <div className="mb-3">
              <img
                src={message.imageUrl || "/placeholder.svg"}
                alt="Uploaded"
                className="w-full max-w-xs rounded-xl object-cover shadow-md"
              />
            </div>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp */}
        <div
          className={`flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ${isUser ? "justify-end" : ""}`}
        >
          <Clock className="w-3 h-3" />
          {formattedTime}
        </div>
      </div>
    </div>
  )
}
