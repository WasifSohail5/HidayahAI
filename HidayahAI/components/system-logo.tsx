interface SystemLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  variant?: "full" | "icon-only"
}

export default function SystemLogo({ size = "md", showText = true, variant = "full" }: SystemLogoProps) {
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
          {/* Islamic Geometric Pattern */}
          <svg
            className={`${currentSize.icon} text-white relative z-10`}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Islamic octagon */}
            <path
              d="M24 4L32 8L40 16L44 24L40 32L32 40L24 44L16 40L8 32L4 24L8 16L16 8L24 4Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />

            {/* Inner guidance symbol */}
            <path
              d="M24 12L30 16L34 24L30 32L24 36L18 32L14 24L18 16L24 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="currentColor"
              fillOpacity="0.3"
            />

            {/* Central truth verification point */}
            <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="24" cy="24" r="2" fill="currentColor" />

            {/* AI precision markers */}
            <circle cx="24" cy="8" r="1" fill="currentColor" opacity="0.7" />
            <circle cx="40" cy="24" r="1" fill="currentColor" opacity="0.7" />
            <circle cx="24" cy="40" r="1" fill="currentColor" opacity="0.7" />
            <circle cx="8" cy="24" r="1" fill="currentColor" opacity="0.7" />
          </svg>
        </div>

        {/* Islamic star accent */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
          <svg className="w-full h-full text-white p-0.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0L9.6 4.8L14.4 3.2L11.2 6.4L16 8L11.2 9.6L14.4 12.8L9.6 11.2L8 16L6.4 11.2L1.6 12.8L4.8 9.6L0 8L4.8 6.4L1.6 3.2L6.4 4.8L8 0Z" />
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
          className={`${currentSize.container} bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden border border-emerald-400/20`}
        >
          {/* Islamic Geometric Pattern */}
          <svg
            className={`${currentSize.icon} text-white relative z-10`}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Islamic octagon */}
            <path
              d="M24 2L34 6L42 14L46 24L42 34L34 42L24 46L14 42L6 34L2 24L6 14L14 6L24 2Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />

            {/* Inner guidance pattern */}
            <path
              d="M24 10L30 14L34 20L38 24L34 28L30 34L24 38L18 34L14 28L10 24L14 20L18 14L24 10Z"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="currentColor"
              fillOpacity="0.2"
            />

            {/* Central verification symbol */}
            <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="24" cy="24" r="3" fill="currentColor" />

            {/* Truth verification points */}
            <circle cx="24" cy="6" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="42" cy="24" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="24" cy="42" r="1.5" fill="currentColor" opacity="0.7" />
            <circle cx="6" cy="24" r="1.5" fill="currentColor" opacity="0.7" />
          </svg>
        </div>

        {/* Islamic star accent */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full border-2 border-white dark:border-slate-800 shadow-sm">
          <svg className="w-full h-full text-white p-0.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0L9.6 4.8L14.4 3.2L11.2 6.4L16 8L11.2 9.6L14.4 12.8L9.6 11.2L8 16L6.4 11.2L1.6 12.8L4.8 9.6L0 8L4.8 6.4L1.6 3.2L6.4 4.8L8 0Z" />
          </svg>
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-bold ${currentSize.text} leading-tight flex items-center gap-2`}>
            <span className="text-emerald-600 dark:text-emerald-400">Hidayah</span>
            <span className="text-teal-600 dark:text-teal-400">AI</span>
          </div>
          <div className={`${currentSize.subtitle} text-slate-600 dark:text-slate-400 font-medium tracking-wide mt-1`}>
            Islamic Truth Verifier
          </div>
          <div className={`${currentSize.subtitle} text-slate-500 dark:text-slate-500 font-arabic opacity-75 mt-0.5`}>
            هدایہ - محقق الحقيقة
          </div>
        </div>
      )}
    </div>
  )
}
