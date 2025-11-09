"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { getFromStorage, saveToStorage, STORAGE_KEYS, type User, type Team, type DailySession } from "@/lib/storage"
import { cn } from "@/lib/utils"

const VIBE_OPTIONS = [
  { id: "rush", label: "Rush Mode", position: { top: "25%", left: "25%" }, delay: "0s" },
  { id: "spicy", label: "Spicy", position: { top: "20%", left: "50%" }, delay: "1s" },
  { id: "tryingNew", label: "Trying New", position: { top: "28%", right: "22%" }, delay: "2s" },
  { id: "healthy", label: "Healthy", position: { top: "50%", left: "20%" }, delay: "0.5s" },
  { id: "comfort", label: "Comfort Food", position: { top: "55%", left: "48%" }, delay: "1.5s" },
  { id: "fancy", label: "Fancy", position: { top: "48%", right: "25%" }, delay: "2.5s" },
]

export default function VibePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [session, setSession] = useState<DailySession | null>(null)
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const savedUser = getFromStorage<User>(STORAGE_KEYS.CURRENT_USER)
    const savedTeam = getFromStorage<Team>(STORAGE_KEYS.TEAM)

    if (!savedUser || !savedTeam) {
      router.push("/join")
      return
    }

    setUser(savedUser)
    setTeam(savedTeam)

    const now = new Date()
    const vibeDeadline = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now
    const voteDeadline = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes from now

    const newSession: DailySession = {
      date: new Date().toISOString().split("T")[0],
      teamId: savedTeam.id,
      phase: "vibe",
      vibeDeadline: vibeDeadline.toISOString(),
      voteDeadline: voteDeadline.toISOString(),
      selectedVibes: {},
      votes: {},
      finalists: [],
    }
    saveToStorage(STORAGE_KEYS.DAILY_SESSION, newSession)
    setSession(newSession)

    // Initialize with user preferences
    const defaultVibes: string[] = []
    if (savedUser.vibes?.rushMode) defaultVibes.push("rush")
    if (savedUser.vibes?.spicy) defaultVibes.push("spicy")
    if (savedUser.vibes?.tryingNew) defaultVibes.push("tryingNew")
    setSelectedVibes(defaultVibes)
  }, [router])

  useEffect(() => {
    if (!session) return

    const updateTimer = () => {
      const now = new Date()
      const deadline = new Date(session.vibeDeadline)
      const diff = deadline.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Time's up!")
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [session, router])

  const toggleVibe = (vibeId: string) => {
    setSelectedVibes((prev) => (prev.includes(vibeId) ? prev.filter((id) => id !== vibeId) : [...prev, vibeId]))
  }

  const handleSubmit = () => {
    if (!user || !session) return

    const updatedSession: DailySession = {
      ...session,
      selectedVibes: {
        ...session.selectedVibes,
        [user.id]: selectedVibes,
      },
    }

    saveToStorage(STORAGE_KEYS.DAILY_SESSION, updatedSession)
    router.push("/vote")
  }

  const handleCopyCode = () => {
    if (!team) return
    navigator.clipboard.writeText(team.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!user || !team || !session) return null

  return (
    <div className="min-h-screen bg-background p-8 relative overflow-hidden">
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>

      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full hover:border-primary/50 transition-colors shadow-sm"
        >
          <span className="text-sm font-medium text-muted-foreground">Team</span>
          <span className="text-lg font-bold font-mono tracking-wider">{team.code}</span>
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </button>

        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full shadow-sm">
          <span className="text-lg font-bold text-primary">{timeRemaining}</span>
        </div>
      </div>

      <div className="relative w-full h-[calc(100vh-200px)] mt-12">
        {VIBE_OPTIONS.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => toggleVibe(vibe.id)}
            style={{
              ...vibe.position,
              animation: `float 4s ease-in-out infinite`,
              animationDelay: vibe.delay,
            }}
            className={cn(
              "absolute px-6 py-3 rounded-full border-2 font-medium transition-all hover:scale-110 active:scale-95",
              selectedVibes.includes(vibe.id)
                ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "border-border bg-card hover:border-primary/50 hover:shadow-md",
            )}
          >
            {vibe.label}
          </button>
        ))}
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="text-center">
          <Button
            onClick={handleSubmit}
            size="lg"
            disabled={selectedVibes.length === 0}
            className="px-8 py-6 text-lg rounded-full"
          >
            Lock In Vibes
          </Button>
        </div>
      </div>
    </div>
  )
}
