"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  references_count?: number
  processing_time?: number
}

export interface Conversation {
  id: string
  title?: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  isArchived?: boolean
}

interface ChatStore {
  conversations: Conversation[]
  currentConversationId: string | null

  // Actions
  createNewConversation: () => void
  setCurrentConversation: (id: string) => void
  addMessage: (message: Message) => void
  clearAllConversations: () => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  archiveConversation: (id: string) => void
  getCurrentConversation: () => Conversation | undefined
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,

      createNewConversation: () => {
        const newConversation: Conversation = {
          id: Date.now().toString(),
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: newConversation.id,
        }))
      },

      setCurrentConversation: (id: string) => {
        set({ currentConversationId: id })
      },

      addMessage: (message: Message) => {
        const { currentConversationId, conversations } = get()

        if (!currentConversationId) {
          // Create new conversation if none exists
          get().createNewConversation()
          // Get the updated state
          const updatedState = get()
          const newCurrentId = updatedState.currentConversationId!

          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === newCurrentId
                ? {
                    ...conv,
                    messages: [...conv.messages, message],
                    updatedAt: new Date(),
                  }
                : conv,
            ),
          }))
        } else {
          set((state) => ({
            conversations: state.conversations.map((conv) =>
              conv.id === currentConversationId
                ? {
                    ...conv,
                    messages: [...conv.messages, message],
                    updatedAt: new Date(),
                  }
                : conv,
            ),
          }))
        }
      },

      clearAllConversations: () => {
        set({
          conversations: [],
          currentConversationId: null,
        })
      },

      deleteConversation: (id: string) => {
        set((state) => {
          const filteredConversations = state.conversations.filter((conv) => conv.id !== id)
          const newCurrentId =
            state.currentConversationId === id
              ? filteredConversations.length > 0
                ? filteredConversations[0].id
                : null
              : state.currentConversationId

          return {
            conversations: filteredConversations,
            currentConversationId: newCurrentId,
          }
        })
      },

      renameConversation: (id: string, title: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv,
          ),
        }))
      },

      archiveConversation: (id: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, isArchived: !conv.isArchived, updatedAt: new Date() } : conv,
          ),
        }))
      },

      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get()
        return conversations.find((conv) => conv.id === currentConversationId)
      },
    }),
    {
      name: "islamic-chat-store",
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    },
  ),
)
