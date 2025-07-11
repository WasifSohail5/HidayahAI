"use client"

import { useState } from "react"

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true)

    try {
      // Create a preview URL for the uploaded image
      const imageUrl = URL.createObjectURL(file)
      setUploadedImage(imageUrl)

      // Here you would typically upload to your server or cloud storage
      // For now, we'll just simulate the upload
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return imageUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const clearImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage)
      setUploadedImage(null)
    }
  }

  return {
    isUploading,
    uploadedImage,
    uploadImage,
    clearImage,
  }
}
