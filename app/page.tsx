"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, Camera, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import ObjectDetection from "@/components/object-detection"

export default function Home() {
  const [image, setImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setProgress(0)

    // Simulate progress for better UX
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + 10
      })
    }, 100)

    const reader = new FileReader()
    reader.onload = () => {
      clearInterval(interval)
      setProgress(100)
      setImage(reader.result as string)
      setIsLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const captureImage = async () => {
    try {
      // Check if the browser supports the camera API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Camera not supported",
          description: "Your browser doesn't support camera access",
          variant: "destructive",
        })
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      const video = document.createElement("video")
      video.srcObject = stream
      video.play()

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve
      })

      // Create a canvas to capture the image
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0)

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/jpeg")
      setImage(dataUrl)

      // Stop the camera stream
      stream.getTracks().forEach((track) => track.stop())
    } catch (error) {
      toast({
        title: "Camera error",
        description: "Could not access the camera",
        variant: "destructive",
      })
    }
  }

  const resetImage = () => {
    setImage(null)
    setIsDetecting(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Object Detection</CardTitle>
          <CardDescription>Upload an image or take a photo to detect objects</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {!image ? (
            <>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 w-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={triggerFileInput}
              >
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <div className="flex gap-4">
                <Button onClick={triggerFileInput} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={captureImage}>
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
              </div>
              {isLoading && (
                <div className="w-full">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-center mt-1 text-gray-500">{progress}% uploaded</p>
                </div>
              )}
            </>
          ) : (
            <div className="relative w-full">
              <ObjectDetection imageUrl={image} isDetecting={isDetecting} setIsDetecting={setIsDetecting} />
            </div>
          )}
        </CardContent>
        {image && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetImage}>
              Upload Another Image
            </Button>
            <Button onClick={() => setIsDetecting(true)} disabled={isDetecting}>
              {isDetecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Detecting...
                </>
              ) : (
                "Detect Objects"
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  )
}
