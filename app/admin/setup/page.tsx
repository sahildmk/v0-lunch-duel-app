"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
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

const CURRENT_TEAM_ID_KEY = "lunchDuel_currentTeamId";

function getTeamId(): Id<"teams"> | null {
  if (typeof window === "undefined") return null;
  const teamId = localStorage.getItem(CURRENT_TEAM_ID_KEY);
  return teamId as Id<"teams"> | null;
}

export default function AdminSetupPage() {
  const router = useRouter();
  const teamId = getTeamId();
  const [officeAddress, setOfficeAddress] = useState("");
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchEnd, setLunchEnd] = useState("13:00");

  const team = useQuery(api.teams.getTeam, teamId ? { teamId } : "skip");
  const updateTeam = useMutation(api.teams.updateTeam);

  useEffect(() => {
    if (team === undefined) return;
    if (!team) {
      router.push("/join");
      return;
    }
    setOfficeAddress(team.officeAddress || "");
    setLunchStart(team.lunchWindowStart || "12:00");
    setLunchEnd(team.lunchWindowEnd || "13:00");
  }, [team, router]);

  const handleSave = async () => {
    if (!teamId) return;

    await updateTeam({
      teamId,
      officeAddress,
      lunchWindowStart: lunchStart,
      lunchWindowEnd: lunchEnd,
    });

    router.push("/admin/places");
  };

  if (!team) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Team Setup</CardTitle>
          <CardDescription>
            Configure your office location and lunch window
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="office-address">Office Address</Label>
            <Input
              id="office-address"
              placeholder="123 Main St, San Francisco, CA"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Used to calculate walk times to restaurants
            </p>
          </div>

          <div className="space-y-4">
            <Label>Lunch Window</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lunch-start" className="text-sm font-normal">
                  Start Time
                </Label>
                <Input
                  id="lunch-start"
                  type="time"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lunch-end" className="text-sm font-normal">
                  End Time
                </Label>
                <Input
                  id="lunch-end"
                  type="time"
                  value={lunchEnd}
                  onChange={(e) => setLunchEnd(e.target.value)}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Vibe selection ends 15 min before, voting lasts 15 min
            </p>
          </div>

          <Button onClick={handleSave} className="w-full" size="lg">
            Continue to Restaurant Setup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
