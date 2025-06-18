"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Trash2, MessageSquare, Star, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface ChatSession {
  id: string
  title: string
  messages: any[]
  timestamp: Date
  isBookmarked: boolean
  sourceType: string
  messageCount: number
}

interface ChatHistoryProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSessionSelect: (session: ChatSession) => void
  onSessionDelete: (sessionId: string) => void
  onSessionBookmark: (sessionId: string) => void
  onNewChat: () => void
}

export function ChatHistory({
  sessions,
  currentSessionId,
  onSessionSelect,
  onSessionDelete,
  onSessionBookmark,
  onNewChat,
}: ChatHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState<"all" | "bookmarked" | "today" | "week">("all")
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "title">("recent")

  const filteredSessions = sessions
    .filter((session) => {
      // Search filter
      if (searchTerm && !session.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Date/bookmark filter
      switch (filterBy) {
        case "bookmarked":
          return session.isBookmarked
        case "today":
          const today = new Date()
          return session.timestamp.toDateString() === today.toDateString()
        case "week":
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return session.timestamp >= weekAgo
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.timestamp.getTime() - b.timestamp.getTime()
        case "title":
          return a.title.localeCompare(b.title)
        default: // recent
          return b.timestamp.getTime() - a.timestamp.getTime()
      }
    })

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 48) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString()
    }
  }

  const getSessionPreview = (session: ChatSession) => {
    const lastUserMessage = session.messages.filter((m) => m.type === "user").pop()
    return lastUserMessage?.content.substring(0, 60) + "..." || "No messages"
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-emerald-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Chat History</h2>
          <Button onClick={onNewChat} size="sm" className="bg-emerald-500 hover:bg-emerald-600">
            <MessageSquare className="w-4 h-4 mr-1" />
            New Chat
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="bookmarked">Bookmarked</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {searchTerm || filterBy !== "all" ? "No conversations found" : "No chat history yet"}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`group relative p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  currentSessionId === session.id
                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
                    : "bg-white border-slate-200 hover:border-emerald-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-emerald-700"
                }`}
                onClick={() => onSessionSelect(session)}
              >
                {/* Session Header */}
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm text-slate-800 dark:text-slate-200 line-clamp-1">
                    {session.title}
                  </h3>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSessionBookmark(session.id)
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Star
                        className={`w-3 h-3 ${
                          session.isBookmarked ? "fill-yellow-400 text-yellow-400" : "text-slate-400"
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSessionDelete(session.id)
                      }}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Session Preview */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                  {getSessionPreview(session)}
                </p>

                {/* Session Metadata */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {session.sourceType}
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{session.messageCount} messages</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(session.timestamp)}</span>
                  </div>
                </div>

                {/* Bookmark indicator */}
                {session.isBookmarked && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Stats */}
      <div className="p-4 border-t border-emerald-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
          {sessions.length} total conversations
          {sessions.filter((s) => s.isBookmarked).length > 0 && (
            <span> • {sessions.filter((s) => s.isBookmarked).length} bookmarked</span>
          )}
        </div>
      </div>
    </div>
  )
}
