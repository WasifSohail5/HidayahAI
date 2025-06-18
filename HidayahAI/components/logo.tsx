import { CroissantIcon as Crescent } from "lucide-react"

interface LogoProps {
  size?: "sm" | "md" | "lg"
}

export default function Logo({ size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full p-2 flex items-center justify-center">
          <Crescent className="text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white dark:border-slate-800"></div>
      </div>
      <div className={`font-bold ${sizeClasses[size]} text-slate-800 dark:text-white`}>
        Hidayah<span className="text-emerald-600 dark:text-emerald-400">AI</span>
      </div>
    </div>
  )
}
