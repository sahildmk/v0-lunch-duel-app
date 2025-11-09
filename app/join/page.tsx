"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Helper functions to store current user/team IDs in localStorage
const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";
const CURRENT_TEAM_ID_KEY = "lunchDuel_currentTeamId";

function saveUserId(userId: Id<"users">) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CURRENT_USER_ID_KEY, userId);
  }
}

function saveTeamId(teamId: Id<"teams">) {
  if (typeof window !== "undefined") {
    localStorage.setItem(CURRENT_TEAM_ID_KEY, teamId);
  }
}

export default function JoinPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "join" | "create">("choose");
  const [teamCode, setTeamCode] = useState("");
  const [userName, setUserName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createUser = useMutation(api.users.createUser);
  const createTeam = useMutation(api.teams.createTeam);
  const joinTeam = useMutation(api.teams.joinTeam);
  const teamByCode = useQuery(
    api.teams.getTeamByCode,
    teamCode.trim() ? { code: teamCode.toUpperCase() } : "skip"
  );

  const handleJoinTeam = async () => {
    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!teamCode.trim()) {
      setError("Please enter a team code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Wait for query to resolve
      if (teamByCode === undefined) {
        // Still loading
        return;
      }

      if (!teamByCode) {
        setError("Team not found. Please check the code and try again.");
        setLoading(false);
        return;
      }

      // Create user with default preferences
      const userId = await createUser({
        name: userName.trim(),
        dietaryRestrictions: [],
        budget: 2,
        maxWalkDistance: 15,
        vibes: {
          rushMode: false,
          spicy: false,
          tryingNew: false,
        },
      });

      // Join team
      await joinTeam({
        teamId: teamByCode._id,
        userId,
      });

      // Save IDs to localStorage
      saveUserId(userId);
      saveTeamId(teamByCode._id);

      // Redirect to preferences page to set up preferences first
      router.push(`/preferences`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to join team. Please try again."
      );
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!teamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create user first with default preferences
      const userId = await createUser({
        name: userName.trim(),
        dietaryRestrictions: [],
        budget: 2,
        maxWalkDistance: 15,
        vibes: {
          rushMode: false,
          spicy: false,
          tryingNew: false,
        },
      });

      // Create team with user as first member
      const result = await createTeam({
        name: teamName.trim(),
        userId,
      });

      // Save IDs to localStorage
      saveUserId(userId);
      saveTeamId(result.teamId);

      // Redirect to preferences page first, then they can set up team
      router.push(`/preferences`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create team. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-primary">
            Vibe Lunch
          </CardTitle>
          <CardDescription className="text-balance text-base">
            The fun way to decide where your team eats lunch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === "choose" && (
            <div className="space-y-3">
              <Button
                onClick={() => setMode("join")}
                className="w-full"
                size="lg"
              >
                Join a Team
              </Button>
              <Button
                onClick={() => setMode("create")}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Create New Team
              </Button>
            </div>
          )}

          {mode === "join" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Your Name</Label>
                <Input
                  id="userName"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamCode">Team Code</Label>
                <Input
                  id="teamCode"
                  placeholder="Enter 6-digit code"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono uppercase"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setMode("choose");
                    setError("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleJoinTeam}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Joining..." : "Join Team"}
                </Button>
              </div>
            </div>
          )}

          {mode === "create" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="creatorName">Your Name</Label>
                <Input
                  id="creatorName"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="e.g., Design Team, Sales Squad"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setMode("choose");
                    setError("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateTeam}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
