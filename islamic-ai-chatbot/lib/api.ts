"use client"

export interface QueryRequest {
  query: string
  source_type: "quran" | "hadith" | "both" | "auto"
  language?: string
  top_k?: number
}

export interface QueryResponse {
  query: string
  answer: string
  source_type: string
  processing_time: number
  references_count: number
  alternatives_used?: string[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function queryIslamicAPI(request: QueryRequest): Promise<QueryResponse> {
  try {
    const response = await fetch(`http://localhost:8000/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("API request failed:", error)
    throw new Error("Failed to get response from Islamic API")
  }
}

export async function checkAPIHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Health check failed:", error)
    throw error
  }
}
