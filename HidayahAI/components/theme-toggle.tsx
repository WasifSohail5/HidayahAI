"use client"

import { Moon, Sun, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
        >
          <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <span className="sr-only">Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-3 cursor-pointer py-3">
          <Sun className="h-4 w-4 text-amber-500" />
          <span>Light Mode</span>
          {theme === "light" && <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></div>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-3 cursor-pointer py-3">
          <Moon className="h-4 w-4 text-slate-600" />
          <span>Dark Mode</span>
          {theme === "dark" && <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></div>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
