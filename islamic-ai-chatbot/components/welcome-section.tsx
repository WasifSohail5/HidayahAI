"use client"

export function WelcomeSection() {
  return (
    <div className="flex-1 flex items-center justify-center p-responsive-sm sm:p-responsive-lg w-full welcome-section">
      <div className="max-w-2xl w-full text-center space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h2 className="text-responsive-xl sm:text-responsive-2xl lg:text-responsive-3xl font-bold text-emerald-700 dark:text-emerald-400 mb-2 arabic-text">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
          </h2>
          <p className="text-responsive-xs sm:text-responsive-sm text-muted-foreground italic">
            Bismillah-ir-Rahman-ir-Raheem
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-responsive-lg sm:text-responsive-xl lg:text-responsive-2xl font-semibold text-foreground">
            Welcome to Islamic Assistant
          </h3>
          <p className="text-responsive-sm sm:text-responsive-base lg:text-responsive-lg text-muted-foreground leading-relaxed px-2 sm:px-0">
            Ask anything about Islam based on the Holy Quran and Authentic Hadith. Get accurate answers with proper
            references and links to original sources.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-responsive-sm sm:p-responsive-md space-y-3 text-left mx-2 sm:mx-0">
          <h4 className="font-semibold text-foreground text-center text-responsive-sm sm:text-responsive-base">
            Example Questions:
          </h4>
          <div className="space-y-2 text-responsive-xs sm:text-responsive-sm text-muted-foreground">
            <p>• "What is the best dhikr to recite?"</p>
            <p>• "سب سے افضل دعا کیا ہے؟"</p>
            <p>• "What does the Quran say about patience?"</p>
            <p>• "Tell me about the five daily prayers"</p>
          </div>
        </div>
      </div>
    </div>
  )
}
