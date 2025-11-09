"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "convex/react";
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
import { ArrowLeft, TrendingUp, Calendar } from "lucide-react";
import { TeamNav } from "@/components/team-nav";

const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";

function getUserId(): Id<"users"> | null {
    if (typeof window === "undefined") return null;
    const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
    return userId as Id<"users"> | null;
}

export default function HistoryPage() {
    const router = useRouter();
    const params = useParams();
    const teamCode = params?.code as string;
    const [userId, setUserId] = useState<Id<"users"> | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setUserId(getUserId());
        }
    }, []);

    const team = useQuery(
        api.teams.getTeamByCode,
        teamCode ? { code: teamCode.toUpperCase() } : "skip"
    );
    const visitCounts = useQuery(
        api.visitHistory.getVisitCounts,
        team?._id ? { teamId: team._id } : "skip"
    );
    const visitHistory = useQuery(
        api.visitHistory.getVisitHistory,
        team?._id ? { teamId: team._id } : "skip"
    );

    if (!team) return null;

    // Create a map of restaurantId -> restaurant
    const restaurantMap = new Map(
        team.restaurants.map((r) => [r.id, r])
    );

    // Group visits by restaurant and sort by count
    const restaurantVisits = team.restaurants
        .map((restaurant) => {
            const count = visitCounts?.[restaurant.id] || 0;
            const visits = visitHistory?.filter((v) => v.restaurantId === restaurant.id) || [];
            return {
                restaurant,
                count,
                visits: visits.sort((a, b) => b.date.localeCompare(a.date)),
            };
        })
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);

    const totalVisits = visitHistory?.length || 0;
    const mostVisited = restaurantVisits[0];

    return (
        <div className="min-h-screen bg-background">
            <TeamNav teamCode={teamCode} userId={userId} />
            <div className="p-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => router.push(`/team/${teamCode}/restaurants`)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold">Visit History</h1>
                                <p className="text-muted-foreground mt-1">
                                    Track how often your team visits each restaurant
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Visits</p>
                                        <p className="text-2xl font-bold">{totalVisits}</p>
                                    </div>
                                    <Calendar className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Restaurants Visited</p>
                                        <p className="text-2xl font-bold">{restaurantVisits.length}</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        {mostVisited && (
                            <Card>
                                <CardContent className="pt-6">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Most Visited</p>
                                        <p className="text-lg font-semibold truncate">{mostVisited.restaurant.name}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {mostVisited.count} {mostVisited.count === 1 ? "visit" : "visits"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Visit Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Restaurant Visits</CardTitle>
                            <CardDescription>
                                See which restaurants your team visits most frequently
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {restaurantVisits.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No visits recorded yet.</p>
                                    <p className="text-sm mt-2">Start voting to build your history!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {restaurantVisits.map(({ restaurant, count, visits }) => {
                                        const percentage = totalVisits > 0 ? (count / totalVisits) * 100 : 0;
                                        const isMostVisited = mostVisited && restaurant.id === mostVisited.restaurant.id;

                                        return (
                                            <div key={restaurant.id} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{restaurant.name}</span>
                                                        {isMostVisited && (
                                                            <Badge variant="default" className="text-xs">
                                                                Most Visited
                                                            </Badge>
                                                        )}
                                                        <Badge variant="secondary">{"$".repeat(restaurant.priceLevel)}</Badge>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-semibold">{count}</span>
                                                        <span className="text-sm text-muted-foreground ml-1">
                                                            {count === 1 ? "visit" : "visits"}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground ml-2">
                                                            ({percentage.toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${isMostVisited ? "bg-primary" : "bg-muted-foreground/50"
                                                            }`}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                                {visits.length > 0 && (
                                                    <div className="text-xs text-muted-foreground pl-2">
                                                        Last visited: {new Date(visits[0].date).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* All Restaurants (including never visited) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Restaurants</CardTitle>
                            <CardDescription>
                                Complete list of restaurants in your team
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {team.restaurants
                                    .sort((a, b) => {
                                        const countA = visitCounts?.[a.id] || 0;
                                        const countB = visitCounts?.[b.id] || 0;
                                        if (countB !== countA) return countB - countA;
                                        return a.name.localeCompare(b.name);
                                    })
                                    .map((restaurant) => {
                                        const count = visitCounts?.[restaurant.id] || 0;
                                        return (
                                            <div
                                                key={restaurant.id}
                                                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{restaurant.name}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {"$".repeat(restaurant.priceLevel)}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {restaurant.walkTime} min
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {count > 0 ? (
                                                        <span>
                                                            {count} {count === 1 ? "visit" : "visits"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs">Never visited</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

