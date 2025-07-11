"use client"

import { useState, useMemo } from "react"
import {
  Trash2,
  MessageSquare,
  Plus,
  Search,
  MoreHorizontal,
  Edit3,
  Archive,
  X,
  HelpCircle,
  Keyboard,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useChatStore } from "@/lib/chat-store"
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns"
import { toast } from "sonner"
import { HelpPanel } from "@/components/help-panel"
import { cn } from "@/lib/utils"

export function ChatHistory() {
  const {
    conversations,
    currentConversationId,
    setCurrentConversation,
    createNewConversation,
    clearAllConversations,
    deleteConversation,
    renameConversation,
  } = useChatStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState<"all" | "today" | "week" | "month">("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [showHelp, setShowHelp] = useState(false)

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations

    // Apply date filter
    if (filterBy !== "all") {
      const now = new Date()
      filtered = conversations.filter((conv) => {
        const convDate = new Date(conv.createdAt)
        switch (filterBy) {
          case "today":
            return isToday(convDate)
          case "week":
            return now.getTime() - convDate.getTime() <= 7 * 24 * 60 * 60 * 1000
          case "month":
            return now.getTime() - convDate.getTime() <= 30 * 24 * 60 * 60 * 1000
          default:
            return true
        }
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((conv) => {
        const title = getConversationTitle(conv)
        const firstMessage = conv.messages.find((m) => m.role === "user")?.content || ""
        return (
          title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          firstMessage.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    return filtered
  }, [conversations, searchQuery, filterBy])

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const groups: { [key: string]: typeof conversations } = {}

    filteredConversations.forEach((conv) => {
      const date = new Date(conv.createdAt)
      let groupKey: string

      if (isToday(date)) {
        groupKey = "Today"
      } else if (isYesterday(date)) {
        groupKey = "Yesterday"
      } else {
        groupKey = format(date, "MMMM d, yyyy")
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(conv)
    })

    return groups
  }, [filteredConversations])

  const handleConversationClick = (conversationId: string) => {
    setCurrentConversation(conversationId)
  }

  const getConversationTitle = (conversation: any) => {
    if (conversation.title) return conversation.title
    const firstUserMessage = conversation.messages.find((m: any) => m.role === "user")
    return firstUserMessage?.content.slice(0, 40) + "..." || "New conversation"
  }

  const getConversationPreview = (conversation: any) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1]
    if (!lastMessage) return "No messages"

    const preview = lastMessage.content.slice(0, 60)
    return preview.length < lastMessage.content.length ? preview + "..." : preview
  }

  const handleRename = (conversationId: string, currentTitle: string) => {
    setEditingId(conversationId)
    setEditingTitle(currentTitle)
  }

  const saveRename = () => {
    if (editingId && editingTitle.trim()) {
      renameConversation(editingId, editingTitle.trim())
      toast.success("Conversation renamed")
    }
    setEditingId(null)
    setEditingTitle("")
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditingTitle("")
  }

  const handleDelete = (conversationId: string) => {
    deleteConversation(conversationId)
    toast.success("Conversation deleted")
  }

  const getMessageCount = (conversation: any) => {
    return conversation.messages.length
  }

  return (
    <>
      <div className="flex flex-col h-full bg-card border-r border-border">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="space-y-3 p-4">
            <Button
              onClick={createNewConversation}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white touch-target-comfortable text-responsive-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-9 text-sm bg-background/50 border-border/50 focus:bg-background focus:border-border transition-colors"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-accent"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-1 overflow-x-auto">
              {["all", "today", "week", "month"].map((filter) => (
                <Button
                  key={filter}
                  variant={filterBy === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterBy(filter as any)}
                  className={cn(
                    "text-xs whitespace-nowrap flex-shrink-0 transition-colors",
                    filterBy === filter
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-background/50 hover:bg-accent",
                  )}
                >
                  {filter === "all" ? "All" : filter === "today" ? "Today" : filter === "week" ? "Week" : "Month"}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-2 pb-4">
              {Object.keys(groupedConversations).length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm space-y-2">
                  <MessageSquare className="h-8 w-8 mx-auto opacity-50" />
                  <p>{searchQuery ? "No conversations found" : "No conversations yet"}</p>
                  <p className="text-xs">
                    {searchQuery ? "Try a different search term" : "Start a new chat to begin!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedConversations).map(([dateGroup, convs]) => (
                    <div key={dateGroup} className="space-y-1">
                      <div className="px-3 py-2">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {dateGroup}
                        </h3>
                      </div>

                      <div className="space-y-1">
                        {convs.map((conversation) => (
                          <div key={conversation.id} className="group relative">
                            <button
                              onClick={() => handleConversationClick(conversation.id)}
                              className={cn(
                                "w-full text-left p-3 rounded-lg transition-all duration-200",
                                "hover:bg-accent/50 focus:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
                                "min-h-[60px] touch-target",
                                conversation.id === currentConversationId
                                  ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800"
                                  : "hover:bg-accent/30",
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                <div className="flex-1 min-w-0 space-y-1">
                                  {editingId === conversation.id ? (
                                    <Input
                                      value={editingTitle}
                                      onChange={(e) => setEditingTitle(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveRename()
                                        if (e.key === "Escape") cancelRename()
                                      }}
                                      onBlur={saveRename}
                                      className="h-7 text-sm"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <>
                                      <div className="text-sm font-medium truncate leading-tight">
                                        {getConversationTitle(conversation)}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate leading-tight">
                                        {getConversationPreview(conversation)}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>
                                          {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                                        </span>
                                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                                          {getMessageCount(conversation)}
                                        </Badge>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </button>

                            {/* Conversation Actions */}
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-accent"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem
                                    onClick={() => handleRename(conversation.id, getConversationTitle(conversation))}
                                  >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(conversation.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="p-4 space-y-3">
            {/* Statistics */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{conversations.length} conversations</span>
              <span>{filteredConversations.length} shown</span>
            </div>

            <Separator />

            {/* Professional Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => setShowHelp(true)}
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 h-9 transition-colors"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 h-9 transition-colors"
              >
                <Keyboard className="h-4 w-4 mr-2" />
                Keyboard Shortcuts
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50 h-9 transition-colors"
              >
                <Zap className="h-4 w-4 mr-2" />
                What's New
              </Button>
            </div>

            <Separator />

            {/* Clear History Button */}
            <Button
              variant="outline"
              onClick={clearAllConversations}
              className="w-full text-destructive hover:text-destructive bg-transparent touch-target text-responsive-xs sm:text-responsive-sm transition-colors"
              disabled={conversations.length === 0}
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Clear All History
            </Button>
          </div>
        </div>
      </div>

      {/* Help Panel Modal */}
      <HelpPanel isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </>
  )
}
