interface IslamicLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  variant?: "full" | "icon-only"
}

export default function IslamicLogo({ size = "md", showText = true, variant = "full" }: IslamicLogoProps) {
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
          className={`${currentSize.container} bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden`}
        >
          {/* Islamic Geometric Background Pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            viewBox="0 0 100 100"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="islamicPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <polygon points="10,0 20,10 10,20 0,10" fill="white" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#islamicPattern)" />
          </svg>

          {/* Main Islamic Calligraphy-Inspired Symbol */}
          <svg
            className={`${currentSize.icon} text-white relative z-10`}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Arabic-inspired calligraphic curves representing "Hidayah" (Guidance) */}
            <path
              d="M12 24C12 18 16 14 22 14C28 14 32 18 32 24C32 30 28 34 22 34"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M22 34C28 34 32 30 32 24"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Truth verification symbol - geometric balance */}
            <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.8" />
            <path
              d="M36 24C36 18 32 14 26 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M26 34C32 34 36 30 36 24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* AI representation - geometric precision */}
            <rect x="20" y="8" width="8" height="2" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="20" y="38" width="8" height="2" rx="1" fill="currentColor" opacity="0.6" />
          </svg>
        </div>

        {/* Islamic star accent */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center">
          <svg className="w-2 h-2 text-white" viewBox="0 0 8 8" fill="currentColor">
            <path d="M4 0L4.8 2.4L7.2 1.6L5.6 3.2L8 4L5.6 4.8L7.2 6.4L4.8 5.6L4 8L3.2 5.6L0.8 6.4L2.4 4.8L0 4L2.4 3.2L0.8 1.6L3.2 2.4L4 0Z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* Main Logo Icon */}
      <div className="relative">
        <div
          className={`${currentSize.container} bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden`}
        >
          {/* Islamic Geometric Background Pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-10"
            viewBox="0 0 100 100"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id="islamicBg" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <polygon points="10,0 20,10 10,20 0,10" fill="white" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#islamicBg)" />
          </svg>

          {/* Main Calligraphic Symbol */}
          <svg
            className={`${currentSize.icon} text-white relative z-10`}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Arabic calligraphy-inspired flowing curves representing "Hidayah" */}
            <path
              d="M8 24C8 16 14 10 22 10C30 10 36 16 36 24C36 32 30 38 22 38C18 38 14 36 12 32"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Inner flowing line representing guidance */}
            <path
              d="M14 24C14 19 17 16 22 16C27 16 30 19 30 24C30 29 27 32 22 32"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />

            {/* Central truth symbol */}
            <circle cx="24" cy="24" r="2.5" fill="currentColor" />

            {/* Verification marks - geometric balance */}
            <path
              d="M38 20L42 24L38 28"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {/* AI precision indicators */}
            <rect x="6" y="6" width="6" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
            <rect x="6" y="40.5" width="6" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
            <rect x="36" y="6" width="6" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
            <rect x="36" y="40.5" width="6" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
          </svg>
        </div>

        {/* Islamic 8-pointed star accent */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0L9.6 4.8L14.4 3.2L11.2 6.4L16 8L11.2 9.6L14.4 12.8L9.6 11.2L8 16L6.4 11.2L1.6 12.8L4.8 9.6L0 8L4.8 6.4L1.6 3.2L6.4 4.8L8 0Z" />
          </svg>
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-bold ${currentSize.text} leading-tight`}>
            {/* Arabic-inspired typography */}
            <span className="text-emerald-600 dark:text-emerald-400 font-arabic">هدایہ</span>
            <span className="text-teal-600 dark:text-teal-400 ml-1">AI</span>
          </div>
          <div className={`${currentSize.subtitle} text-slate-600 dark:text-slate-400 font-medium tracking-wide`}>
            Islamic Truth Verifier
          </div>
          {/* Arabic subtitle */}
          <div className={`${currentSize.subtitle} text-slate-500 dark:text-slate-500 font-arabic opacity-75`}>
            الحقيقة الإسلامية
          </div>
        </div>
      )}
    </div>
  )
}
