"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ExternalLink, MapPin } from "lucide-react"
import {
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
  type User,
  type Team,
  type DailySession,
  type Restaurant,
} from "@/lib/storage"
import { cn } from "@/lib/utils"

export default function VotePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [session, setSession] = useState<DailySession | null>(null)
  const [finalists, setFinalists] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  useEffect(() => {
    const savedUser = getFromStorage<User>(STORAGE_KEYS.CURRENT_USER)
    const savedTeam = getFromStorage<Team>(STORAGE_KEYS.TEAM)
    const savedSession = getFromStorage<DailySession>(STORAGE_KEYS.DAILY_SESSION)

    if (!savedUser || !savedTeam || !savedSession) {
      router.push("/join")
      return
    }

    setUser(savedUser)
    setTeam(savedTeam)
    setSession(savedSession)

    // Check if user already voted
    if (savedSession.votes[savedUser.id]) {
      setHasVoted(true)
      const userVotes = savedSession.votes[savedUser.id]
      const votedId = Object.keys(userVotes).find((id) => userVotes[id] > 0)
      if (votedId) setSelectedRestaurant(votedId)
    }

    // Get finalists or generate them
    if (savedSession.finalists.length === 0) {
      // Generate finalists based on team vibes
      const selected = selectFinalists(savedTeam, savedUser)
      const updatedSession = {
        ...savedSession,
        finalists: selected.map((r) => r.id),
      }
      saveToStorage(STORAGE_KEYS.DAILY_SESSION, updatedSession)
      setSession(updatedSession)
      setFinalists(selected)
    } else {
      // Load existing finalists
      const finalistRestaurants = savedSession.finalists
        .map((id) => savedTeam.restaurants.find((r) => r.id === id))
        .filter(Boolean) as Restaurant[]
      setFinalists(finalistRestaurants)
    }
  }, [router])

  useEffect(() => {
    if (!session) return

    const updateTimer = () => {
      const now = new Date()
      const deadline = new Date(session.voteDeadline)
      const diff = deadline.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Voting closed!")
        // Auto-advance to results
        setTimeout(() => router.push("/result"), 2000)
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

  const selectFinalists = (team: Team, user: User): Restaurant[] => {
    // Simple finalist selection based on user preferences
    const eligible = team.restaurants.filter((r) => r.walkTime <= user.maxWalkDistance && r.priceLevel <= user.budget)

    if (eligible.length === 0) return team.restaurants.slice(0, 2)
    if (eligible.length === 1) return [eligible[0], team.restaurants[0]]

    // Randomly select 2 from eligible
    const shuffled = [...eligible].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 2)
  }

  const handleVote = (restaurantId: string) => {
    if (!user || !session || hasVoted) return

    setSelectedRestaurant(restaurantId)
    setHasVoted(true)

    const updatedSession: DailySession = {
      ...session,
      votes: {
        ...session.votes,
        [user.id]: {
          [restaurantId]: 1,
        },
      },
    }

    saveToStorage(STORAGE_KEYS.DAILY_SESSION, updatedSession)
    setSession(updatedSession)
  }

  const handleViewResults = () => {
    router.push("/result")
  }

  if (!user || !team || !session || finalists.length < 2) return null

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Timer Header */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Voting Phase</p>
                  <p className="text-xs text-muted-foreground">Choose your favorite</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold font-serif text-primary">{timeRemaining}</p>
                <p className="text-xs text-muted-foreground">until results</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voting Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-serif">The Duel</h1>
          <p className="text-muted-foreground">
            {hasVoted ? "Your vote has been recorded!" : "Pick your lunch champion"}
          </p>
        </div>

        {/* Restaurant Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {finalists.map((restaurant) => (
            <Card
              key={restaurant.id}
              className={cn(
                "transition-all cursor-pointer hover:scale-[1.02]",
                selectedRestaurant === restaurant.id ? "border-primary border-2 shadow-lg" : "hover:border-primary/50",
                hasVoted && selectedRestaurant !== restaurant.id && "opacity-50",
              )}
              onClick={() => !hasVoted && handleVote(restaurant.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-2xl font-serif">{restaurant.name}</CardTitle>
                  {restaurant.link && (
                    <a
                      href={restaurant.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{restaurant.walkTime} min</span>
                  </div>
                  <Badge variant="secondary">{"$".repeat(restaurant.priceLevel)}</Badge>
                </div>

                {restaurant.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {restaurant.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {restaurant.dietaryOptions.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Dietary options:</p>
                    <div className="flex flex-wrap gap-1">
                      {restaurant.dietaryOptions.map((option) => (
                        <Badge key={option} variant="secondary" className="text-xs">
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRestaurant === restaurant.id && (
                  <div className="pt-3">
                    <Badge className="w-full justify-center py-2">Your Choice</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Button */}
        {hasVoted && (
          <div className="text-center">
            <Button onClick={handleViewResults} size="lg" className="w-full max-w-md">
              View Current Results
            </Button>
          </div>
        )}

        {/* Vote Meter */}
        {hasVoted && session.votes && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-center">Team Votes</p>
                <div className="space-y-2">
                  {finalists.map((restaurant) => {
                    const votes = Object.values(session.votes).filter(
                      (vote) => vote[restaurant.id] && vote[restaurant.id] > 0,
                    ).length
                    const totalVotes = Object.keys(session.votes).length
                    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0

                    return (
                      <div key={restaurant.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{restaurant.name}</span>
                          <span className="text-muted-foreground">{votes} votes</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
