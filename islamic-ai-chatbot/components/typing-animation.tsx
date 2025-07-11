"use client"

export function TypingAnimation() {
  return (
    <div className="flex items-center space-x-1">
      <span className="text-sm text-muted-foreground">Assistant is typing</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
      </div>
    </div>
  )
}
