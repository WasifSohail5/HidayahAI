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

// Backend API URL - Local FastAPI server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function queryIslamicAPI(request: QueryRequest): Promise<QueryResponse> {
  try {
    console.log("Sending request to:", `${API_BASE_URL}/query`)
    console.log("Request data:", request)

    const response = await fetch(`${API_BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(request),
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error Response:", errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const data = await response.json()
    console.log("API Response:", data)
    return data
  } catch (error) {
    console.error("API request failed:", error)

    // Network error ke liye user-friendly message
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to the Islamic Assistant API. Please make sure the backend server is running on http://localhost:8000",
      )
    }

    throw new Error(`Failed to get response from Islamic API: ${error.message}`)
  }
}

export async function checkAPIHealth() {
  try {
    console.log("Checking API health at:", `${API_BASE_URL}/health`)

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log("API Health Check:", data)
    return data
  } catch (error) {
    console.error("Health check failed:", error)
    throw error
  }
}

// Test connection function
export async function testConnection() {
  try {
    const health = await checkAPIHealth()
    return {
      success: true,
      message: "Successfully connected to Islamic Assistant API",
      data: health,
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null,
    }
  }
}
