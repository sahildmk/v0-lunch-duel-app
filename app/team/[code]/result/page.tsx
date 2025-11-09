"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, ExternalLink, MapPin, Users } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";

const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";

function getUserId(): Id<"users"> | null {
  if (typeof window === "undefined") return null;
  const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
  return userId as Id<"users"> | null;
}

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const teamCode = params?.code as string;
  const userId = getUserId();
  const [showConfetti, setShowConfetti] = useState(true);
  const { width, height } = useWindowSize();

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const team = useQuery(
    api.teams.getTeamByCode,
    teamCode ? { code: teamCode.toUpperCase() } : "skip"
  );

  const today = new Date().toISOString().split("T")[0];
  const session = useQuery(
    api.sessions.getSession,
    team?._id ? { teamId: team._id, date: today } : "skip"
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

  // Calculate winner if not already determined
  useEffect(() => {
    if (!session || !team || session.winnerId) return;

    const winnerId = calculateWinner(session, team);
    updateSession({
      sessionId: session._id,
      winnerId,
      phase: "result",
    }).catch(console.error);
  }, [session, team, updateSession]);

  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const calculateWinner = (
    sessionData: NonNullable<typeof session>,
    teamData: NonNullable<typeof team>
  ): string => {
    const finalists = sessionData.finalists
      .map((id: string) =>
        teamData.restaurants.find(
          (r: NonNullable<typeof team>["restaurants"][number]) => r.id === id
        )
      )
      .filter(Boolean) as NonNullable<typeof team>["restaurants"];

    if (finalists.length === 0) return teamData.restaurants[0]?.id || "";

    // Count votes for each finalist
    const votes =
      (sessionData.votes as Record<string, Record<string, number>>) || {};
    const voteCounts: Record<string, number> = {};
    finalists.forEach(
      (f: NonNullable<typeof team>["restaurants"][number]) =>
        (voteCounts[f.id] = 0)
    );

    Object.values(votes).forEach((userVotes) => {
      Object.entries(userVotes).forEach(([restaurantId, score]) => {
        if (voteCounts[restaurantId] !== undefined) {
          voteCounts[restaurantId] += score;
        }
      });
    });

    // Find winner (highest votes)
    let maxVotes = -1;
    let winnerId = finalists[0].id;

    Object.entries(voteCounts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winnerId = id;
      }
    });

    // If tie, use tiebreaker criteria
    if (
      maxVotes === 0 ||
      Object.values(voteCounts).filter((v) => v === maxVotes).length > 1
    ) {
      // Tiebreaker: prefer closer restaurants
      const tiedRestaurants = finalists.filter(
        (f: NonNullable<typeof team>["restaurants"][number]) =>
          voteCounts[f.id] === maxVotes
      );
      tiedRestaurants.sort(
        (
          a: NonNullable<typeof team>["restaurants"][number],
          b: NonNullable<typeof team>["restaurants"][number]
        ) => a.walkTime - b.walkTime
      );
      winnerId = tiedRestaurants[0].id;
    }

    return winnerId;
  };

  const getVoteCount = (restaurantId: string): number => {
    if (!session) return 0;
    const votes =
      (session.votes as Record<string, Record<string, number>>) || {};
    return Object.values(votes).filter(
      (vote) => vote[restaurantId] && vote[restaurantId] > 0
    ).length;
  };

  const winner = useMemo(() => {
    if (!session || !team || !session.winnerId) return null;
    return team.restaurants.find((r) => r.id === session.winnerId) || null;
  }, [session, team]);

  const handleNewDay = () => {
    // Navigate to vibe page for new day (session will be created fresh)
    router.push(`/team/${teamCode}/vibe`);
  };

  if (!user || !team || !session || !winner) return null;

  const votes = (session.votes as Record<string, Record<string, number>>) || {};
  const totalVotes = Object.keys(votes).length;
  const winnerVotes = getVoteCount(winner.id);

  return (
    <div className="min-h-screen bg-background p-4 py-8 relative">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Winner Announcement */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/20 p-4 rounded-full">
                <Trophy className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Winner
              </p>
              <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary">
                {winner.name}
              </h1>
            </div>
          </CardContent>
        </Card>

        {/* Winner Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lunch Details</span>
              {winner.link && (
                <a
                  href={winner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Map
                  </Button>
                </a>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <div>
                  <p className="text-xs">Walk Time</p>
                  <p className="font-medium text-foreground">
                    {winner.walkTime} minutes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <div>
                  <p className="text-xs">Team Votes</p>
                  <p className="font-medium text-foreground">
                    {winnerVotes} / {totalVotes}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Price:</span>
              <Badge variant="secondary">{"$".repeat(winner.priceLevel)}</Badge>
            </div>

            {winner.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {winner.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {winner.dietaryOptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Dietary Options</p>
                <div className="flex flex-wrap gap-2">
                  {winner.dietaryOptions.map((option) => (
                    <Badge key={option} variant="secondary">
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vote Breakdown */}
        {session.finalists.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Vote Breakdown</CardTitle>
              <CardDescription>How the team voted</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.finalists.map((finalistId) => {
                  const restaurant = team.restaurants.find(
                    (r) => r.id === finalistId
                  );
                  if (!restaurant) return null;

                  const voteCount = getVoteCount(finalistId);
                  const percentage =
                    totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                  const isWinner = finalistId === winner.id;

                  return (
                    <div key={finalistId} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{restaurant.name}</span>
                          {isWinner && (
                            <Trophy className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {voteCount} {voteCount === 1 ? "vote" : "votes"}
                        </span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isWinner ? "bg-primary" : "bg-muted-foreground/50"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Button */}
        <div className="text-center pt-4">
          <Button onClick={handleNewDay} size="lg" className="w-full max-w-md">
            Start Tomorrow's Duel
          </Button>
        </div>
      </div>
    </div>
  );
}

