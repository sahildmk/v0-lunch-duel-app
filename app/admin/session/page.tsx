"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Clock, ArrowRight, RotateCcw } from "lucide-react";

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

export default function AdminSessionPage() {
  const router = useRouter();
  const userId = getUserId();
  const teamId = getTeamId();
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const team = useQuery(api.teams.getTeam, teamId ? { teamId } : "skip");

  const today = new Date().toISOString().split("T")[0];
  const session = useQuery(
    api.sessions.getSession,
    team?._id ? { teamId: team._id, date: today } : "skip"
  );

  const updateSession = useMutation(api.sessions.updateSession);
  const createSession = useMutation(api.sessions.createSession);

  // Redirect if not admin
  useEffect(() => {
    if (user === undefined || team === undefined) return;
    if (!user || !team) {
      router.push("/join");
      return;
    }
    if (user.isAdmin !== true) {
      router.push(`/team/${team.code}/vibe`);
      return;
    }
  }, [user, team, router]);

  // Update countdown timer
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const now = Date.now();
      let deadline: number;

      if (session.phase === "vibe") {
        deadline = session.vibeDeadline;
      } else if (session.phase === "vote") {
        deadline = session.voteDeadline;
      } else {
        setTimeRemaining("Session ended");
        return;
      }

      const diff = deadline - now;
      if (diff <= 0) {
        setTimeRemaining("Time expired");
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const handleAdvanceToVote = async () => {
    if (!session) return;
    await updateSession({
      sessionId: session._id,
      phase: "vote",
    });
  };

  const handleRevealResults = async () => {
    if (!session) return;
    await updateSession({
      sessionId: session._id,
      phase: "result",
    });
  };

  const handleResetToVibe = async () => {
    if (!session || !team) return;

    // Create new session for today
    const now = Date.now();
    await createSession({
      date: today,
      teamId: team._id,
      vibeDeadline: now + 5 * 60 * 1000, // 5 minutes from now
      voteDeadline: now + 10 * 60 * 1000, // 10 minutes from now
    });
  };

  if (!user || !team || user.isAdmin !== true) return null;

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "vibe":
        return "bg-blue-500";
      case "vote":
        return "bg-orange-500";
      case "result":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Session Control</CardTitle>
          <CardDescription>
            Manage the current lunch voting session for {team.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {session ? (
            <>
              {/* Current Phase */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Phase</span>
                  <Badge className={getPhaseColor(session.phase)}>
                    {session.phase.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Timer */}
              {(session.phase === "vibe" || session.phase === "vote") && (
                <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {session.phase === "vibe"
                        ? "Vibe selection ends in"
                        : "Voting ends in"}
                    </p>
                    <p className="text-2xl font-bold font-mono">
                      {timeRemaining}
                    </p>
                  </div>
                </div>
              )}

              {/* Phase Controls */}
              <div className="space-y-3">
                {session.phase === "vibe" && (
                  <Button
                    onClick={handleAdvanceToVote}
                    className="w-full"
                    size="lg"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Advance to Voting Phase
                  </Button>
                )}

                {session.phase === "vote" && (
                  <Button
                    onClick={handleRevealResults}
                    className="w-full"
                    size="lg"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Reveal Results
                  </Button>
                )}

                {(session.phase === "result" || session.phase === "inactive") && (
                  <Button
                    onClick={handleResetToVibe}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Start New Session
                  </Button>
                )}
              </div>

              {/* Quick Navigation */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Quick Navigation
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/team/${team.code}/vibe`)}
                  >
                    Vibe Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/team/${team.code}/vote`)}
                  >
                    Vote Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/team/${team.code}/result`)}
                  >
                    Result Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin/places")}
                  >
                    Manage Places
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                No active session for today. Create one to start the lunch
                voting process.
              </p>
              <Button
                onClick={handleResetToVibe}
                className="w-full"
                size="lg"
              >
                Create Today's Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
