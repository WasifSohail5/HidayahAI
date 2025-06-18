import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const backendUrl = "http://localhost:8000"

    const response = await fetch(`${backendUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000), // Reduced timeout to 3 seconds
    })

    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({ status: "connected", backend: data })
  } catch (error) {
    // Don't log connection errors as they're expected when backend is not running
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Return a proper response instead of throwing
    return NextResponse.json(
      {
        status: "disconnected",
        error: errorMessage,
        message: "Backend not available. Please start your FastAPI server.",
      },
      { status: 200 }, // Return 200 instead of 503 to avoid fetch errors
    )
  }
}
