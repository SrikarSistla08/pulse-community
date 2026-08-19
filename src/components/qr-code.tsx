"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

interface QrCodeProps {
  value: string
  size?: number
}

export default function QrCode({ value, size = 128 }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: {
        dark: "#1a1a1a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
  }, [value, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  )
}
