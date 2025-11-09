"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Utensils, Users, Trophy, Clock } from "lucide-react";

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

export default function HomePage() {
  const router = useRouter();
  const userId = getUserId();
  const teamId = getTeamId();

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const team = useQuery(api.teams.getTeam, teamId ? { teamId } : "skip");

  const hasActiveSession = user && team;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo/Title */}
        <div className="space-y-4">
          <div className="inline-block p-4 bg-primary/10 rounded-full">
            <Utensils className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold text-foreground">
            Vibe Lunch
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            End lunch debates. Your team picks vibes, votes, and discovers where
            to eat.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            onClick={() => router.push("/join")}
            size="lg"
            className="w-full sm:w-auto px-8"
          >
            Get Started
          </Button>
          {hasActiveSession && (
            <Button
              onClick={() => router.push(`/team/${team.code}/vibe`)}
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-8"
            >
              Go to My Team
            </Button>
          )}
        </div>

        {/* How It Works */}
        <div className="pt-8 space-y-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm">Set vibes</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">Vote</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Decide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
