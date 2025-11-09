"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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

  useEffect(() => {
    // If we have IDs but queries are still loading, wait
    if ((userId && user === undefined) || (teamId && team === undefined)) {
      return;
    }

    if (user && team) {
      // User is already in a team, redirect to vibe page with team code
      router.push(`/team/${team.code}/vibe`);
    } else {
      // New user, go to join page
      router.push("/join");
    }
  }, [user, team, router, userId, teamId]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold text-foreground">
          Lunch Duel
        </h1>
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
