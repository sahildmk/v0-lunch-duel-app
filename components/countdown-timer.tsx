"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface CountdownTimerProps {
  deadline: string // ISO timestamp
  onComplete?: () => void
}

export function CountdownTimer({ deadline, onComplete }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const target = new Date(deadline)
      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Time's up!")
        onComplete?.()
        return
      }

      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)

      if (hours > 0) {
        setTimeRemaining(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      } else {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [deadline, onComplete])

  return (
    <div className="flex items-center gap-2 text-primary">
      <Clock className="h-4 w-4" />
      <span className="font-mono font-medium">{timeRemaining}</span>
    </div>
  )
}
