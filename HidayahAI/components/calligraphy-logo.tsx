interface CalligraphyLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  variant?: "full" | "icon-only"
}

export default function CalligraphyLogo({ size = "md", showText = true, variant = "full" }: CalligraphyLogoProps) {
  const sizeClasses = {
    sm: {
      container: "w-8 h-8",
      text: "text-sm",
      icon: "w-6 h-6",
      subtitle: "text-xs",
    },
    md: {
      container: "w-12 h-12",
      text: "text-lg",
      icon: "w-10 h-10",
      subtitle: "text-xs",
    },
    lg: {
      container: "w-16 h-16",
      text: "text-xl",
      icon: "w-14 h-14",
      subtitle: "text-sm",
    },
    xl: {
      container: "w-20 h-20",
      text: "text-2xl",
      icon: "w-18 h-18",
      subtitle: "text-base",
    },
  }

  const currentSize = sizeClasses[size]

  if (variant === "icon-only") {
    return (
      <div className="relative">
        <div
          className={`${currentSize.container} bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden border border-emerald-400/20`}
        >
          {/* Islamic Geometric Border Pattern */}
          <div className="absolute inset-1 border border-white/20 rounded-xl"></div>

          {/* Traditional Islamic Calligraphy Symbol */}
          <svg
            className={`${currentSize.icon} text-white relative z-10`}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Stylized Arabic "ه" (Ha) from Hidayah */}
            <path
              d="M16 32C16 24 20 18 28 16C36 14 44 18 48 26C48 30 46 34 42 36C38 38 34 36 32 32C30 28 32 24 36 24C40 24 42 28 40 32"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Truth verification dot */}
            <circle cx="32" cy="32" r="2" fill="currentColor" />

            {/* AI precision lines */}
            <path d="M20 48L44 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <path d="M24 52L40 52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          </svg>
        </div>

        {/* Crescent moon accent */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center">
          <svg className="w-2 h-2 text-white" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 0C3 0 0 3 0 6C0 9 3 12 6 12C7 12 8 11.5 8.5 11C7 10.5 6 9 6 7.5C6 6 7 4.5 8.5 4C8 3.5 7 3 6 3C4.5 3 3 4.5 3 6C3 7.5 4.5 9 6 9C6.5 9 7 8.8 7.3 8.5C7 8.8 6.5 9 6 9C4.5 9 3 7.5 3 6C3 4.5 4.5 3 6 3V0Z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {/* Main Calligraphy Icon */}
      <div className="relative">
        <div
          className={`${currentSize.container} bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden border border-emerald-400/20`}
        >
          {/* Islamic Geometric Border */}
          <div className="absolute inset-1 border border-white/20 rounded-xl"></div>

          {/* Traditional Calligraphy */}
          <svg
            className={`${currentSize.icon} text-white relative z-10`}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Arabic calligraphy representing guidance and truth */}
            <path
              d="M12 32C12 20 18 12 28 10C38 8 48 14 52 24C54 28 52 34 48 38C44 42 38 40 34 36C30 32 32 26 38 26C44 26 48 30 46 36C44 42 38 44 32 42"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Inner calligraphic flourish */}
            <path
              d="M20 32C20 26 24 22 30 22C36 22 40 26 40 32"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />

            {/* Central truth point */}
            <circle cx="32" cy="32" r="2.5" fill="currentColor" />

            {/* Verification marks */}
            <path
              d="M48 28L54 32L48 36"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Base line representing foundation */}
            <path d="M16 48L48 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <path d="M20 52L44 52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          </svg>
        </div>

        {/* Crescent and star accent */}
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full border-2 border-white dark:border-slate-800 shadow-lg flex items-center justify-center">
          <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C5 0 2 3 2 6C2 9 5 12 8 12C9.5 12 11 11 11.5 10C9.5 9 8 7 8 5C8 3 9.5 1 11.5 0C11 0 9.5 0 8 0Z" />
            <circle cx="12" cy="4" r="1.5" />
          </svg>
        </div>
      </div>

      {/* Enhanced Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-bold ${currentSize.text} leading-tight flex items-center gap-2`}>
            {/* Arabic text */}
            <span className="text-emerald-600 dark:text-emerald-400 font-arabic text-lg">هدایہ</span>
            <span className="text-teal-600 dark:text-teal-400 font-sans">AI</span>
          </div>
          <div className={`${currentSize.subtitle} text-slate-600 dark:text-slate-400 font-medium tracking-wide mt-1`}>
            Islamic Truth Verifier
          </div>
          <div className={`${currentSize.subtitle} text-slate-500 dark:text-slate-500 font-arabic opacity-75 mt-0.5`}>
            محقق الحقيقة الإسلامية
          </div>
        </div>
      )}
    </div>
  )
}
