"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";
const CURRENT_TEAM_ID_KEY = "lunchDuel_currentTeamId";

function getUserId(): Id<"users"> | null {
  if (typeof window === "undefined") return null;
  const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
  return userId as Id<"users"> | null;
}

function getTeamId(): Id<"teams"> | null {
  if (typeof window === "undefined") return null;
  const teamId = localStorage.getItem(CURRENT_TEAM_ID_KEY);
  return teamId as Id<"teams"> | null;
}

export default function VotePage() {
  const router = useRouter();
  const userId = getUserId();
  const teamId = getTeamId();
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(
    null
  );
  const [hasVoted, setHasVoted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const team = useQuery(api.teams.getTeam, teamId ? { teamId } : "skip");

  const today = new Date().toISOString().split("T")[0];
  const session = useQuery(
    api.sessions.getSession,
    teamId ? { teamId, date: today } : "skip"
  );

  const updateSession = useMutation(api.sessions.updateSession);

  // Redirect if no user or team
  useEffect(() => {
    if (user === undefined || team === undefined || session === undefined)
      return;
    if (!user || !team || !session) {
      router.push("/join");
    }
  }, [user, team, session, router]);

  // Redirect back to vibe if phase is still "vibe" and time hasn't expired
  useEffect(() => {
    if (!session) return;

    const checkShouldRedirect = () => {
      const now = new Date();
      const isTimeExpired = now.getTime() >= session.vibeDeadline;
      const isPhaseVote = session.phase === "vote";

      // If phase is still "vibe" and time hasn't expired, redirect back to vibe
      if (!isPhaseVote && !isTimeExpired) {
        router.push("/vibe");
      }
    };

    checkShouldRedirect();
    const interval = setInterval(checkShouldRedirect, 1000);
    return () => clearInterval(interval);
  }, [session, router]);

  // Check if user already voted and set finalists
  useEffect(() => {
    if (!session || !userId) return;

    const votes =
      (session.votes as Record<string, Record<string, number>>) || {};
    if (votes[userId]) {
      setHasVoted(true);
      const userVotes = votes[userId];
      const votedId = Object.keys(userVotes).find((id) => userVotes[id] > 0);
      if (votedId) setSelectedRestaurant(votedId);
    }

    // Generate finalists if not set
    if (session.finalists.length === 0 && team && user) {
      const selected = selectFinalists(team, user);
      updateSession({
        sessionId: session._id,
        finalists: selected.map(
          (r: NonNullable<typeof team>["restaurants"][number]) => r.id
        ),
      }).catch(console.error);
    }
  }, [session, userId, team, user, updateSession]);

  // Timer
  useEffect(() => {
    if (!session) return;

    const updateTimer = () => {
      const now = new Date();
      const deadline = session.voteDeadline;
      const diff = deadline - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Voting closed!");
        setTimeout(() => router.push("/result"), 2000);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session, router]);

  const selectFinalists = (
    teamData: NonNullable<typeof team>,
    userData: NonNullable<typeof user>
  ): NonNullable<typeof team>["restaurants"] => {
    // Simple finalist selection based on user preferences
    const eligible = teamData.restaurants.filter(
      (r: NonNullable<typeof team>["restaurants"][number]) =>
        r.walkTime <= userData.maxWalkDistance &&
        r.priceLevel <= userData.budget
    );

    if (eligible.length === 0) return teamData.restaurants.slice(0, 2);
    if (eligible.length === 1) return [eligible[0], teamData.restaurants[0]];

    // Randomly select 2 from eligible
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  };

  const finalists = useMemo(() => {
    if (!session || !team) return [];
    if (session.finalists.length === 0) return [];
    return session.finalists
      .map((id: string) =>
        team.restaurants.find(
          (r: NonNullable<typeof team>["restaurants"][number]) => r.id === id
        )
      )
      .filter(Boolean) as NonNullable<typeof team>["restaurants"];
  }, [session, team]);

  const handleVote = async (restaurantId: string) => {
    if (!user || !session || !userId || hasVoted) return;

    setSelectedRestaurant(restaurantId);
    setHasVoted(true);

    const votes =
      (session.votes as Record<string, Record<string, number>>) || {};
    await updateSession({
      sessionId: session._id,
      votes: {
        ...votes,
        [userId]: {
          [restaurantId]: 1,
        },
      },
    });
  };

  const handleViewResults = () => {
    router.push("/result");
  };

  if (!user || !team || !session || finalists.length < 2) return null;

  const votes = (session.votes as Record<string, Record<string, number>>) || {};

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
                  <p className="text-xs text-muted-foreground">
                    Choose your favorite
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold font-serif text-primary">
                  {timeRemaining}
                </p>
                <p className="text-xs text-muted-foreground">until results</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voting Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-serif">The Duel</h1>
          <p className="text-muted-foreground">
            {hasVoted
              ? "Your vote has been recorded!"
              : "Pick your lunch champion"}
          </p>
        </div>

        {/* Restaurant Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {finalists.map((restaurant) => (
            <Card
              key={restaurant.id}
              className={cn(
                "transition-all cursor-pointer hover:scale-[1.02]",
                selectedRestaurant === restaurant.id
                  ? "border-primary border-2 shadow-lg"
                  : "hover:border-primary/50",
                hasVoted && selectedRestaurant !== restaurant.id && "opacity-50"
              )}
              onClick={() => !hasVoted && handleVote(restaurant.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-2xl font-serif">
                    {restaurant.name}
                  </CardTitle>
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
                  <Badge variant="secondary">
                    {"$".repeat(restaurant.priceLevel)}
                  </Badge>
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
                    <p className="text-xs text-muted-foreground mb-1">
                      Dietary options:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {restaurant.dietaryOptions.map((option) => (
                        <Badge
                          key={option}
                          variant="secondary"
                          className="text-xs"
                        >
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRestaurant === restaurant.id && (
                  <div className="pt-3">
                    <Badge className="w-full justify-center py-2">
                      Your Choice
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Button */}
        {hasVoted && (
          <div className="text-center">
            <Button
              onClick={handleViewResults}
              size="lg"
              className="w-full max-w-md"
            >
              View Current Results
            </Button>
          </div>
        )}

        {/* Vote Meter */}
        {hasVoted && votes && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-center">Team Votes</p>
                <div className="space-y-2">
                  {finalists.map((restaurant) => {
                    const voteCount = Object.values(votes).filter(
                      (vote) => vote[restaurant.id] && vote[restaurant.id] > 0
                    ).length;
                    const totalVotes = Object.keys(votes).length;
                    const percentage =
                      totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                    return (
                      <div key={restaurant.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{restaurant.name}</span>
                          <span className="text-muted-foreground">
                            {voteCount} votes
                          </span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
