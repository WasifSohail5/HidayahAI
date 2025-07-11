"use client"

import { X, MessageSquare, Mic, ImageIcon, Keyboard, Zap, HelpCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface HelpPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  if (!isOpen) return null

  const features = [
    {
      icon: MessageSquare,
      title: "Ask Islamic Questions",
      description: "Get answers based on Quran and authentic Hadith",
      tips: ["Be specific in your questions", "Ask in English or Urdu", "Reference specific topics or verses"],
    },
    {
      icon: Mic,
      title: "Voice Input",
      description: "Use your microphone to ask questions",
      tips: ["Click the microphone icon", "Speak clearly", "Works in multiple languages"],
    },
    {
      icon: ImageIcon,
      title: "Image Upload",
      description: "Upload images for context or analysis",
      tips: ["Supports common image formats", "Use for Arabic text recognition", "Maximum file size: 10MB"],
    },
  ]

  const shortcuts = [
    { key: "Ctrl + N", action: "New conversation" },
    { key: "Ctrl + K", action: "Search conversations" },
    { key: "Enter", action: "Send message" },
    { key: "Shift + Enter", action: "New line in message" },
    { key: "Ctrl + /", action: "Show shortcuts" },
    { key: "Esc", action: "Close modals" },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Help & Support
            </CardTitle>
            <CardDescription>Learn how to get the most out of Islamic Assistant</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0" aria-label="Close help">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <CardContent className="p-6 space-y-8">
            {/* Getting Started */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Getting Started</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                  <Card key={index} className="border border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <feature.icon className="h-4 w-4 text-emerald-600" />
                        <CardTitle className="text-sm">{feature.title}</CardTitle>
                      </div>
                      <CardDescription className="text-xs">{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        {feature.tips.map((tip, tipIndex) => (
                          <div key={tipIndex} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <Separator />

            {/* Keyboard Shortcuts */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                    <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Example Questions */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Example Questions</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">English Questions</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• "What is the best dhikr to recite?"</p>
                    <p>• "What does the Quran say about patience?"</p>
                    <p>• "Tell me about the five daily prayers"</p>
                    <p>• "What are the pillars of Islam?"</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Urdu Questions</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• "سب سے افضل دعا کیا ہے؟"</p>
                    <p>• "نماز کے فوائد کیا ہیں؟"</p>
                    <p>• "روزے کے احکام بتائیں"</p>
                    <p>• "حج کی تفصیل دیں"</p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Support */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Need More Help?</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                  <div className="text-left">
                    <div className="font-medium">Contact Support</div>
                    <div className="text-xs text-muted-foreground">Get help from our team</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                  <div className="text-left">
                    <div className="font-medium">Community Forum</div>
                    <div className="text-xs text-muted-foreground">Connect with other users</div>
                  </div>
                </Button>
              </div>
            </section>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  )
}
