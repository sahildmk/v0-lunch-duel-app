"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

const CURRENT_USER_ID_KEY = "lunchDuel_currentUserId";

function getUserId(): Id<"users"> | null {
  if (typeof window === "undefined") return null;
  const userId = localStorage.getItem(CURRENT_USER_ID_KEY);
  return userId as Id<"users"> | null;
}

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Halal",
  "Kosher",
];

const BUDGET_LABELS = ["$", "$$", "$$$"];
const WALK_DISTANCE_OPTIONS = [5, 10, 15, 20, 25, 30];

export default function PreferencesPage() {
  const router = useRouter();
  const userId = getUserId();
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [budget, setBudget] = useState(2);
  const [maxWalkDistance, setMaxWalkDistance] = useState(15);
  const [rushMode, setRushMode] = useState(false);
  const [spicy, setSpicy] = useState(false);
  const [tryingNew, setTryingNew] = useState(true);

  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");
  const team = useQuery(
    api.teams.getTeam,
    user?.teamId ? { teamId: user.teamId } : "skip"
  );
  const updateUser = useMutation(api.users.updateUser);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.push("/join");
      return;
    }
    setDietaryRestrictions(user.dietaryRestrictions || []);
    setBudget(user.budget || 2);
    setMaxWalkDistance(user.maxWalkDistance || 15);
    setRushMode(user.vibes?.rushMode || false);
    setSpicy(user.vibes?.spicy || false);
    setTryingNew(user.vibes?.tryingNew ?? true);
  }, [user, router]);

  const toggleDietary = (option: string) => {
    setDietaryRestrictions((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const handleSave = async () => {
    if (!userId) return;

    await updateUser({
      userId,
      dietaryRestrictions,
      budget,
      maxWalkDistance,
      vibes: {
        rushMode,
        spicy,
        tryingNew,
      },
    });

    if (team?.code) {
      router.push(`/team/${team.code}/vibe`);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Preferences</CardTitle>
            <CardDescription>
              Set your dietary needs, budget, and default vibes to help find the
              perfect lunch spot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Dietary Restrictions */}
            <div className="space-y-4">
              <Label className="text-base">Dietary Restrictions</Label>
              <div className="grid grid-cols-2 gap-3">
                {DIETARY_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={dietaryRestrictions.includes(option)}
                      onCheckedChange={() => toggleDietary(option)}
                    />
                    <label
                      htmlFor={option}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-4">
              <Label className="text-base">Budget Preference</Label>
              <div className="flex gap-2">
                {[1, 2, 3].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={budget === level ? "default" : "outline"}
                    size="lg"
                    onClick={() => setBudget(level)}
                    className="flex-1"
                  >
                    {BUDGET_LABELS[level - 1]}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Your maximum price point for lunch
              </p>
            </div>

            {/* Walk Distance */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Max Walk Distance</Label>
                <span className="text-sm font-medium">
                  {maxWalkDistance} minutes
                </span>
              </div>
              <Slider
                value={[maxWalkDistance]}
                onValueChange={(value) => setMaxWalkDistance(value[0])}
                min={5}
                max={30}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 min</span>
                <span>30 min</span>
              </div>
            </div>

            {/* Default Vibes */}
            <div className="space-y-4">
              <Label className="text-base">Default Vibes</Label>
              <p className="text-sm text-muted-foreground">
                Set your typical mood (you can change these daily)
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="rush-mode"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Rush Mode
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Prioritize quick service and nearby spots
                    </p>
                  </div>
                  <Checkbox
                    id="rush-mode"
                    checked={rushMode}
                    onCheckedChange={(checked) =>
                      setRushMode(checked as boolean)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="spicy"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Spicy
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Love some heat in your meals
                    </p>
                  </div>
                  <Checkbox
                    id="spicy"
                    checked={spicy}
                    onCheckedChange={(checked) => setSpicy(checked as boolean)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <label
                      htmlFor="trying-new"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Trying New Places
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Explore spots you haven't been to recently
                    </p>
                  </div>
                  <Checkbox
                    id="trying-new"
                    checked={tryingNew}
                    onCheckedChange={(checked) =>
                      setTryingNew(checked as boolean)
                    }
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full" size="lg">
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
