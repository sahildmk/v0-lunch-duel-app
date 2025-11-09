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
import {
    Users,
    Utensils,
    History,
    MapPin,
    Clock,
    Calendar,
} from "lucide-react";
import { TeamNav } from "@/components/team-nav";

const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";

function getUserId(): Id<"users"> | null {
    if (typeof window === "undefined") return null;
    const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
    return userId as Id<"users"> | null;
}

export default function TeamPage() {
    const router = useRouter();
    const params = useParams();
    const teamCode = params?.code as string;
    const [userId, setUserId] = useState<Id<"users"> | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setUserId(getUserId());
        }
    }, []);

    const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
    const team = useQuery(
        api.teams.getTeamByCode,
        teamCode ? { code: teamCode.toUpperCase() } : "skip"
    );
    const teamMembers = useQuery(
        api.users.getUsersByIds,
        team?.members ? { userIds: team.members } : "skip"
    );
    const visitCounts = useQuery(
        api.visitHistory.getVisitCounts,
        team?._id ? { teamId: team._id } : "skip"
    );

    // Redirect if no user or team
    useEffect(() => {
        if (user === undefined || team === undefined) return;
        if (!user) {
            router.push("/join");
        }
    }, [user, team, router]);

    // Show error if team not found (after loading)
    if (user !== undefined && team === null) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-foreground">Team Not Found</h1>
                    <p className="text-muted-foreground">
                        The team code "{teamCode}" doesn't exist.
                    </p>
                    <Button onClick={() => router.push("/join")}>Back to Join</Button>
                </div>
            </div>
        );
    }

    if (!user || !team || !teamMembers) return null;

    const totalVisits = visitCounts
        ? Object.values(visitCounts).reduce((sum, count) => sum + count, 0)
        : 0;
    const uniqueRestaurantsVisited = visitCounts
        ? Object.keys(visitCounts).filter((id) => visitCounts[id] > 0).length
        : 0;

    return (
        <div className="min-h-screen bg-background">
            <TeamNav teamCode={teamCode} userId={userId} />
            <div className="p-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold font-serif">{team.name}</h1>
                        <p className="text-muted-foreground mt-1">Team Overview</p>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <Users className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{team.members.length}</p>
                                        <p className="text-sm text-muted-foreground">Team Members</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <Utensils className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{team.restaurants.length}</p>
                                        <p className="text-sm text-muted-foreground">Restaurants</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <History className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{totalVisits}</p>
                                        <p className="text-sm text-muted-foreground">Total Visits</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Team Members */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Team Members
                            </CardTitle>
                            <CardDescription>
                                {teamMembers.length} {teamMembers.length === 1 ? "member" : "members"} in your team
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-3">
                                {teamMembers.map((member) => (
                                    <div
                                        key={member._id}
                                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                                    >
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Users className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{member.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {member.isAdmin && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Admin
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    Budget: {"$".repeat(member.budget)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Team Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {team.officeAddress && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium">Office Address</p>
                                        <p className="text-sm text-muted-foreground">{team.officeAddress}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">Lunch Window</p>
                                    <p className="text-sm text-muted-foreground">
                                        {team.lunchWindowStart} - {team.lunchWindowEnd}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Navigation */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push(`/team/${teamCode}/restaurants`)}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Utensils className="h-5 w-5" />
                                    Restaurants
                                </CardTitle>
                                <CardDescription>
                                    View and manage your team's restaurant list
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {team.restaurants.length} restaurant{team.restaurants.length !== 1 ? "s" : ""} available
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push(`/team/${teamCode}/history`)}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Visit History
                                </CardTitle>
                                <CardDescription>
                                    See where your team has been eating
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {uniqueRestaurantsVisited} restaurant{uniqueRestaurantsVisited !== 1 ? "s" : ""} visited
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Daily Session Navigation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Today's Lunch Duel
                            </CardTitle>
                            <CardDescription>Join today's voting session</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => router.push(`/team/${teamCode}/vibe`)}
                                    className="flex-1"
                                >
                                    Start Today's Duel
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/team/${teamCode}/vibe`)}
                                >
                                    View Vibe Phase
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

