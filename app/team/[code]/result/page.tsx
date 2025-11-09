"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
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
import { Trophy, ExternalLink, MapPin, Users, CreditCard, TrendingDown, Tag, Settings } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/use-window-size";
import { shouldRedirect } from "@/lib/session-helpers";
import { getRestaurantImage } from "@/lib/restaurant-images";
import { TeamNav } from "@/components/team-nav";

const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";

function getUserId(): Id<"users"> | null {
  if (typeof window === "undefined") return null;
  const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
  return userId as Id<"users"> | null;
}

export default function ResultPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
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
  const recordVisit = useMutation(api.visitHistory.recordVisit);
  const loyaltyCard = useQuery(
    api.loyaltyCards.getLoyaltyCard,
    team?._id && session?.winnerId
      ? { teamId: team._id, restaurantId: session.winnerId }
      : "skip"
  );
  const discounts = useQuery(
    api.discounts.getDiscounts,
    team?._id && session?.winnerId
      ? { teamId: team._id, restaurantId: session.winnerId }
      : "skip"
  );

  // Redirect if no user or team
  useEffect(() => {
    if (user === undefined || team === undefined || session === undefined)
      return;
    if (!user) {
      router.push("/join");
    }
  }, [user, team, session, router]);

  // Phase validation - redirect if not on result phase
  useEffect(() => {
    if (!teamCode || session === undefined) return;

    const redirectPath = shouldRedirect(pathname, session, teamCode);
    if (redirectPath) {
      router.push(redirectPath);
    }
  }, [session, teamCode, pathname, router]);

  // Show error if team not found (after loading)
  if (user !== undefined && team === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Team Not Found</h1>
          <p className="text-muted-foreground">
            The team code "{teamCode}" doesn't exist.
          </p>
          <button
            onClick={() => router.push("/join")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to Join
          </button>
        </div>
      </div>
    );
  }

  // Calculate winner if not already determined (only if in result phase)
  useEffect(() => {
    if (!session || !team || session.winnerId) return;

    // Only calculate winner if session is in result phase
    if (session.phase !== "result") return;

    const winnerId = calculateWinner(session, team);
    updateSession({
      sessionId: session._id,
      winnerId,
    }).catch(console.error);
  }, [session, team, updateSession]);

  // Record visit when winner is determined
  useEffect(() => {
    if (!session || !team || !session.winnerId || session.phase !== "result") return;

    recordVisit({
      teamId: team._id,
      restaurantId: session.winnerId,
      date: today,
      sessionId: session._id,
    }).catch(console.error);
  }, [session, team, today, recordVisit]);

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

  // Check if we can start tomorrow's duel (only if it's a different day)
  const isSameDay = session ? session.date === today : true;

  if (!user || !team || !session || !winner) return null;

  const votes = (session.votes as Record<string, Record<string, number>>) || {};
  const totalVotes = Object.keys(votes).length;
  const winnerVotes = getVoteCount(winner.id);

  return (
    <div className="min-h-screen bg-background">
      <TeamNav teamCode={teamCode} userId={userId} />
      <div className="p-4 py-8 relative">
        {showConfetti && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={500}
          />
        )}

        {/* Admin Button */}
        {user.isAdmin === true && (
          <button
            onClick={() => router.push("/admin/session")}
            className="fixed top-24 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full hover:bg-orange-500/20 transition-colors shadow-sm"
            title="Admin Controls"
          >
            <Settings className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">Admin</span>
          </button>
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

              {/* Loyalty Card Perks */}
              {loyaltyCard && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <p className="text-sm font-medium text-foreground">Loyalty Card Perks</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                    <p className="text-sm text-foreground">{loyaltyCard.perks}</p>
                    {loyaltyCard.savings && (
                      <div className="flex items-center gap-2 text-primary">
                        <TrendingDown className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Save up to £{loyaltyCard.savings.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {loyaltyCard.notes && (
                      <p className="text-xs text-muted-foreground">{loyaltyCard.notes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Active Discounts */}
              {discounts && discounts.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-foreground">Active Discounts</p>
                  </div>
                  <div className="space-y-2">
                    {discounts.map((discount) => {
                      const discountText =
                        discount.discountType === "percentage"
                          ? discount.amount
                            ? `${discount.amount}% ${discount.discount}`
                            : discount.discount
                          : discount.amount
                            ? `£${discount.amount} ${discount.discount}`
                            : discount.discount;

                      return (
                        <div
                          key={discount._id}
                          className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                  {discountText}
                                </span>
                                {discount.expirationDate && (
                                  <Badge variant="outline" className="text-xs">
                                    Expires: {new Date(discount.expirationDate).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                              {discount.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {discount.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                            className={`h-full transition-all duration-500 ${isWinner ? "bg-primary" : "bg-muted-foreground/50"
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

          {/* Action Buttons */}
          <div className="text-center pt-4 space-y-3">
            <Button
            onClick={handleNewDay}
            size="lg"
            className="w-full max-w-md"
            disabled={isSameDay}
          >
              {isSameDay ? "Available Tomorrow" : "Start Tomorrow's Duel"}
            </Button>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push(`/team/${teamCode}/restaurants`)}
              >
                View Restaurants
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/team/${teamCode}/history`)}
              >
                View History
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
