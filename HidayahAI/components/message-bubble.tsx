import type { Message } from "@/lib/types"

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user"
  const formattedTime = message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
          isUser ? "bg-slate-600 dark:bg-slate-700" : "bg-gradient-to-r from-emerald-500 to-teal-600"
        }`}
      >
        {isUser ? "You" : "AI"}
      </div>

      <div className={`max-w-[80%] space-y-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl p-3 shadow-sm ${
            isUser
              ? "bg-emerald-600 text-white"
              : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
          }`}
        >
          {message.type === "image" && message.imageUrl && (
            <img
              src={message.imageUrl || "/placeholder.svg"}
              alt="Uploaded"
              className="w-full max-w-xs rounded-lg mb-2 object-cover"
            />
          )}
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        <div className={`text-xs text-slate-500 dark:text-slate-400 ${isUser ? "text-right" : ""}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  )
}
