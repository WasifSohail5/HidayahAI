import type React from "react"
import type { Metadata } from "next"
import { Inter, Amiri } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
})

export const metadata: Metadata = {
  title: "HidayahAI - Islamic Guidance Chatbot",
  description: "Divine Guidance through Quran and Authentic Hadith",
  keywords: ["Islam", "Quran", "Hadith", "Islamic guidance", "AI chatbot"],
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${amiri.variable}`}>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
