"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  generateTeamCode,
  generateId,
  saveToStorage,
  getFromStorage,
  STORAGE_KEYS,
  type User,
  type Team,
} from "@/lib/storage"

export default function JoinPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"choose" | "join" | "create">("choose")
  const [teamCode, setTeamCode] = useState("")
  const [userName, setUserName] = useState("")
  const [teamName, setTeamName] = useState("")
  const [error, setError] = useState("")

  const handleJoinTeam = () => {
    if (!userName.trim()) {
      setError("Please enter your name")
      return
    }
    if (!teamCode.trim()) {
      setError("Please enter a team code")
      return
    }

    // Check if team exists (in real app, this would be a server check)
    // For now, since we're using local storage, we'll just accept any code
    // and create the team if it doesn't exist
    const existingTeam = getFromStorage<Team>(STORAGE_KEYS.TEAM)

    if (existingTeam && existingTeam.code === teamCode.toUpperCase()) {
      // Join existing team
      const userId = generateId()
      const user: User = {
        id: userId,
        name: userName.trim(),
        teamId: existingTeam.id,
        dietaryRestrictions: [],
        budget: 2,
        maxWalkDistance: 15,
        vibes: {
          rushMode: false,
          spicy: false,
          tryingNew: false,
        },
      }

      existingTeam.members.push(userId)
      saveToStorage(STORAGE_KEYS.CURRENT_USER, user)
      saveToStorage(STORAGE_KEYS.TEAM, existingTeam)
      router.push("/preferences")
    } else {
      setError("Team not found. Create a new team instead?")
    }
  }

  const handleCreateTeam = () => {
    if (!userName.trim()) {
      setError("Please enter your name")
      return
    }
    if (!teamName.trim()) {
      setError("Please enter a team name")
      return
    }

    const teamId = generateId()
    const userId = generateId()
    const code = generateTeamCode()

    const user: User = {
      id: userId,
      name: userName.trim(),
      teamId,
      dietaryRestrictions: [],
      budget: 2,
      maxWalkDistance: 15,
      vibes: {
        rushMode: false,
        spicy: false,
        tryingNew: false,
      },
    }

    const team: Team = {
      id: teamId,
      code,
      name: teamName.trim(),
      officeAddress: "",
      lunchWindowStart: "12:00",
      lunchWindowEnd: "12:30",
      members: [userId],
      restaurants: [],
    }

    saveToStorage(STORAGE_KEYS.CURRENT_USER, user)
    saveToStorage(STORAGE_KEYS.TEAM, team)

    // Redirect to admin setup since they created the team
    router.push("/admin/setup")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-4xl font-bold text-primary">Lunch Duel</CardTitle>
          <CardDescription className="text-balance text-base">
            The fun way to decide where your team eats lunch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === "choose" && (
            <div className="space-y-3">
              <Button onClick={() => setMode("join")} className="w-full" size="lg">
                Join a Team
              </Button>
              <Button onClick={() => setMode("create")} variant="outline" className="w-full" size="lg">
                Create New Team
              </Button>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Your Name</Label>
                <Input
                  id="userName"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamCode">Team Code</Label>
                <Input
                  id="teamCode"
                  placeholder="Enter 6-digit code"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono uppercase"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setMode("choose")
                    setError("")
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleJoinTeam} className="flex-1">
                  Join Team
                </Button>
              </div>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="creatorName">Your Name</Label>
                <Input
                  id="creatorName"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="e.g., Design Team, Sales Squad"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setMode("choose")
                    setError("")
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button onClick={handleCreateTeam} className="flex-1">
                  Create Team
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
