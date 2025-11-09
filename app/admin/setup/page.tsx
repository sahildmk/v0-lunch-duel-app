"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getFromStorage, saveToStorage, STORAGE_KEYS, type Team } from "@/lib/storage"

export default function AdminSetupPage() {
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [officeAddress, setOfficeAddress] = useState("")
  const [lunchStart, setLunchStart] = useState("12:00")
  const [lunchEnd, setLunchEnd] = useState("13:00")

  useEffect(() => {
    const savedTeam = getFromStorage<Team>(STORAGE_KEYS.TEAM)
    if (!savedTeam) {
      router.push("/join")
      return
    }
    setTeam(savedTeam)
    setOfficeAddress(savedTeam.officeAddress || "")
    setLunchStart(savedTeam.lunchWindowStart || "12:00")
    setLunchEnd(savedTeam.lunchWindowEnd || "13:00")
  }, [router])

  const handleSave = () => {
    if (!team) return

    const updatedTeam: Team = {
      ...team,
      officeAddress,
      lunchWindowStart: lunchStart,
      lunchWindowEnd: lunchEnd,
    }

    saveToStorage(STORAGE_KEYS.TEAM, updatedTeam)
    router.push("/admin/places")
  }

  if (!team) return null

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Team Setup</CardTitle>
          <CardDescription>Configure your office location and lunch window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="office-address">Office Address</Label>
            <Input
              id="office-address"
              placeholder="123 Main St, San Francisco, CA"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">Used to calculate walk times to restaurants</p>
          </div>

          <div className="space-y-4">
            <Label>Lunch Window</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lunch-start" className="text-sm font-normal">
                  Start Time
                </Label>
                <Input
                  id="lunch-start"
                  type="time"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunch-end" className="text-sm font-normal">
                  End Time
                </Label>
                <Input id="lunch-end" type="time" value={lunchEnd} onChange={(e) => setLunchEnd(e.target.value)} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Vibe selection ends 15 min before, voting lasts 15 min</p>
          </div>

          <Button onClick={handleSave} className="w-full" size="lg">
            Continue to Restaurant Setup
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
