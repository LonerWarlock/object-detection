"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

// Define the detection result type
interface Detection {
  bbox: [number, number, number, number]
  class: string
  score: number
}

interface ObjectDetectionProps {
  imageUrl: string
  isDetecting: boolean
  setIsDetecting: (isDetecting: boolean) => void
}

export default function ObjectDetection({ imageUrl, isDetecting, setIsDetecting }: ObjectDetectionProps) {
  const [detections, setDetections] = useState<Detection[]>([])
  const [model, setModel] = useState<any>(null)
  const [modelLoading, setModelLoading] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  // Load the COCO-SSD model
  useEffect(() => {
    async function loadModel() {
      try {
        setModelLoading(true)
        // Dynamically import TensorFlow.js and COCO-SSD model
        const tf = await import("@tensorflow/tfjs")
        const cocoSsd = await import("@tensorflow-models/coco-ssd")

        // Load and warm up the model
        const loadedModel = await cocoSsd.load()
        setModel(loadedModel)
        setModelLoading(false)
      } catch (error) {
        console.error("Failed to load model:", error)
        toast({
          title: "Model loading failed",
          description: "Could not load the object detection model",
          variant: "destructive",
        })
        setModelLoading(false)
      }
    }

    loadModel()
  }, [toast])

  // Detect objects when isDetecting changes to true
  useEffect(() => {
    if (isDetecting && model && imageRef.current) {
      detectObjects()
    }
  }, [isDetecting, model])

  // Draw bounding boxes when detections change
  useEffect(() => {
    if (detections.length > 0 && canvasRef.current && imageRef.current) {
      drawBoundingBoxes()
    }
  }, [detections])

  const detectObjects = async () => {
    if (!model || !imageRef.current) return

    try {
      // Run inference
      const predictions = await model.detect(imageRef.current)
      setDetections(predictions)
      setIsDetecting(false)

      if (predictions.length === 0) {
        toast({
          title: "No objects detected",
          description: "Try another image or a different angle",
        })
      }
    } catch (error) {
      console.error("Detection error:", error)
      toast({
        title: "Detection failed",
        description: "An error occurred during object detection",
        variant: "destructive",
      })
      setIsDetecting(false)
    }
  }

  const drawBoundingBoxes = () => {
    const image = imageRef.current
    const canvas = canvasRef.current

    if (!canvas || !image) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions to match the image
    canvas.width = image.width
    canvas.height = image.height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw bounding boxes
    detections.forEach((detection) => {
      const [x, y, width, height] = detection.bbox
      const score = Math.round(detection.score * 100)

      // Draw rectangle
      ctx.strokeStyle = "#FF0000"
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, width, height)

      // Draw label background
      ctx.fillStyle = "rgba(255, 0, 0, 0.7)"
      const textWidth = ctx.measureText(`${detection.class} ${score}%`).width + 10
      ctx.fillRect(x, y - 20, textWidth, 20)

      // Draw label text
      ctx.fillStyle = "white"
      ctx.font = "16px Arial"
      ctx.fillText(`${detection.class} ${score}%`, x + 5, y - 5)
    })
  }

  return (
    <div className="relative">
      {(modelLoading || isDetecting) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-lg">
          <div className="bg-white p-4 rounded-lg flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>{modelLoading ? "Loading model..." : "Detecting objects..."}</p>
          </div>
        </div>
      )}

      <div className="relative">
        <img
          ref={imageRef}
          src={imageUrl || "/placeholder.svg"}
          alt="Uploaded image"
          className="w-full h-auto rounded-lg"
          crossOrigin="anonymous"
        />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
      </div>

      {detections.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Detected Objects:</h3>
          <div className="flex flex-wrap gap-2">
            {detections.map((detection, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {detection.class} ({Math.round(detection.score * 100)}%)
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
