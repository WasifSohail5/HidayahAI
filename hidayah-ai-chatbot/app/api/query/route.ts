import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Use local backend folder
    const backendUrl = "http://localhost:8000"

    console.log(`Attempting to connect to backend at: ${backendUrl}`)

    const response = await fetch(`${backendUrl}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error:", error)

    // Mock response for development
    const body = await request.json() // Declare body here
    const mockResponse = {
      query: body.query,
      answer: `**Mock Response** - Backend not available. 

This is a demonstration response. Your question was: "${body.query}"

In a real scenario, this would be answered using authentic Islamic sources:

**From the Quran:**
"And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish his purpose." - Surah At-Talaq, Ayah 3 (https://quran.com/65/3)

**From Hadith:**
The Prophet (ﷺ) said: "The believer is not one who eats his fill while his neighbor goes hungry." - Sahih Bukhari, Hadith 6018 (https://sunnah.com/bukhari:6018)

*Note: Please ensure your FastAPI backend is running in the backend folder to get real responses with authentic Islamic references.*`,
      source_type: "both",
      processing_time: 0.5,
      references_count: 2,
      alternatives_used: null,
    }

    return NextResponse.json(mockResponse)
  }
}
