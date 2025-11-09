"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getFromStorage, STORAGE_KEYS } from "@/lib/storage"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user already has a team
    const currentUser = getFromStorage(STORAGE_KEYS.CURRENT_USER)
    const team = getFromStorage(STORAGE_KEYS.TEAM)

    if (currentUser && team) {
      // User is already in a team, redirect to appropriate page
      // For now, go to join page (we'll add routing logic later)
      router.push("/vibe")
    } else {
      // New user, go to join page
      router.push("/join")
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-foreground">Lunch Duel</h1>
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
