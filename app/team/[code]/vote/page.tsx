"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink, MapPin, CreditCard, Tag, Utensils, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRestaurantImage } from "@/lib/restaurant-images";
import { shouldRedirect } from "@/lib/session-helpers";

const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";

function getUserId(): Id<"users"> | null {
  if (typeof window === "undefined") return null;
  const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
  return userId as Id<"users"> | null;
}

export default function VotePage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const teamCode = params?.code as string;
  const userId = getUserId();
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(
    null
  );
  const [hasVoted, setHasVoted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [copied, setCopied] = useState(false);

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

  // Fetch additional data for restaurants
  const loyaltyCards = useQuery(
    api.loyaltyCards.getLoyaltyCards,
    team?._id ? { teamId: team._id } : "skip"
  );
  const discounts = useQuery(
    api.discounts.getTeamDiscounts,
    team?._id ? { teamId: team._id } : "skip"
  );
  const pitches = useQuery(
    api.pitches.getTeamPitches,
    team?._id ? { teamId: team._id } : "skip"
  );
  const teamMembers = useQuery(
    api.users.getUsersByIds,
    team?.members ? { userIds: team.members } : "skip"
  );

  // Redirect if no user or team
  useEffect(() => {
    if (user === undefined || team === undefined || session === undefined)
      return;
    if (!user) {
      router.push("/join");
    }
  }, [user, team, session, router]);

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

  // Phase validation - redirect if not on correct phase
  useEffect(() => {
    if (!teamCode || session === undefined) return;

    const redirectPath = shouldRedirect(pathname, session, teamCode);
    if (redirectPath) {
      router.push(redirectPath);
    }
  }, [session, teamCode, pathname, router]);

  // Check if user already voted
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

    // Note: Finalists are now generated server-side when admin advances to vote phase
  }, [session, userId]);

  // Timer
  useEffect(() => {
    if (!session || !teamCode) return;

    const updateTimer = () => {
      const now = new Date();
      const deadline = session.voteDeadline;
      const diff = deadline - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Voting closed!");
        setTimeout(() => router.push(`/team/${teamCode}/result`), 2000);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session, router, teamCode]);

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
    if (!user || !session || !userId) return;

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

  const handleCopyCode = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user || !team || !session || finalists.length < 2) return null;

  const votes = (session.votes as Record<string, Record<string, number>>) || {};

  // Create lookup maps
  const loyaltyCardMap = new Map(
    loyaltyCards?.map((card) => [card.restaurantId, card]) || []
  );
  const discountsMap = new Map<string, typeof discounts>();
  discounts?.forEach((discount) => {
    if (!discountsMap.has(discount.restaurantId)) {
      discountsMap.set(discount.restaurantId, []);
    }
    discountsMap.get(discount.restaurantId)!.push(discount);
  });
  const pitchesMap = new Map<string, typeof pitches>();
  pitches?.forEach((pitch) => {
    if (!pitchesMap.has(pitch.restaurantId)) {
      pitchesMap.set(pitch.restaurantId, []);
    }
    pitchesMap.get(pitch.restaurantId)!.push(pitch);
  });
  const userMap = new Map(teamMembers?.map((u) => [u._id, u]) || []);

  return (
    <div className="min-h-screen bg-background p-8 relative overflow-hidden">
      {/* Top Right Controls */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        {user.isAdmin === true && (
          <button
            onClick={() => router.push("/admin/session")}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full hover:bg-orange-500/20 transition-colors shadow-sm"
            title="Admin Controls"
          >
            <Settings className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-600">Admin</span>
          </button>
        )}

        <button
          onClick={handleCopyCode}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full hover:border-primary/50 transition-colors shadow-sm"
        >
          <span className="text-sm font-medium text-muted-foreground">
            Team
          </span>
          <span className="text-lg font-bold font-mono tracking-wider">
            {team.code}
          </span>
          {copied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>

        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-full shadow-sm">
          <span className="text-lg font-bold text-primary">
            {timeRemaining}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 mt-12">
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
          {finalists.map((restaurant) => {
            const loyaltyCard = loyaltyCardMap.get(restaurant.id);
            const restaurantDiscounts = discountsMap.get(restaurant.id) || [];
            const restaurantPitches = pitchesMap.get(restaurant.id) || [];

            return (
              <Card
                key={restaurant.id}
                className={cn(
                  "transition-all cursor-pointer hover:scale-[1.02]",
                  selectedRestaurant === restaurant.id
                    ? "border-primary border-2 shadow-lg"
                    : "hover:border-primary/50",
                  hasVoted && selectedRestaurant !== restaurant.id && "opacity-50"
                )}
                onClick={() => handleVote(restaurant.id)}
              >
                {/* Restaurant Image */}
                <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/10">
                  <img
                    src={restaurant.imageUrl || getRestaurantImage(restaurant.name, restaurant.tags)}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(restaurant.name + " restaurant")}`;
                    }}
                  />
                  {restaurantDiscounts.length > 0 && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-600 hover:bg-green-700 text-white">
                        <Tag className="h-3 w-3 mr-1" />
                        {restaurantDiscounts.length} Deal{restaurantDiscounts.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  )}
                </div>

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

                  {/* B2B Discounts */}
                  {restaurantDiscounts.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t">
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">
                          B2B Deals
                        </span>
                      </div>
                      <div className="space-y-1">
                        {restaurantDiscounts.slice(0, 2).map((discount) => {
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
                              className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded px-2 py-1"
                            >
                              <p className="text-xs font-medium text-green-700 dark:text-green-400">
                                {discountText}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Personal Loyalty Card */}
                  {loyaltyCard && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CreditCard className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium">Personal Card</span>
                      </div>
                      <div className="bg-primary/5 border border-primary/20 rounded px-2 py-1">
                        <p className="text-xs text-foreground">{loyaltyCard.perks}</p>
                        {loyaltyCard.savings && (
                          <p className="text-xs text-primary mt-0.5">
                            Save £{loyaltyCard.savings.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pitches */}
                  {restaurantPitches.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Utensils className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium">
                          Team Pitches ({restaurantPitches.length})
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {restaurantPitches.slice(0, 3).map((pitch) => {
                          const pitchUser = userMap.get(pitch.userId);
                          return (
                            <div
                              key={pitch._id}
                              className="bg-muted/50 border rounded px-2 py-1"
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                  {pitchUser?.name || "Team member"}
                                </span>
                              </div>
                              <p className="text-xs text-foreground">{pitch.pitch}</p>
                            </div>
                          );
                        })}
                        {restaurantPitches.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{restaurantPitches.length - 3} more pitch{restaurantPitches.length - 3 > 1 ? "es" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

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
            );
          })}
        </div>

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

      {/* Bottom Status Message */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="text-center">
          {hasVoted ? (
            <div className="px-6 py-3 bg-primary/20 border border-primary/30 rounded-full backdrop-blur-xl shadow-lg">
              <p className="text-sm font-medium text-primary">
                Vote saved! Waiting for admin to reveal results...
              </p>
            </div>
          ) : (
            <div className="px-6 py-3 bg-background/60 border border-border rounded-full backdrop-blur-xl shadow-lg">
              <p className="text-sm font-medium text-muted-foreground">
                Select your favorite restaurant
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
