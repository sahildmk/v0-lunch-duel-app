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
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ExternalLink, Sparkles } from "lucide-react";
import { seedShoreditchRestaurants } from "@/lib/seed-data";

const CURRENT_TEAM_ID_KEY = "lunchDuel_currentTeamId";

function getTeamId(): Id<"teams"> | null {
  if (typeof window === "undefined") return null;
  const teamId = localStorage.getItem(CURRENT_TEAM_ID_KEY);
  return teamId as Id<"teams"> | null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function AdminPlacesPage() {
  const router = useRouter();
  const teamId = getTeamId();
  const [restaurants, setRestaurants] = useState<
    Array<{
      id: string;
      name: string;
      link?: string;
      address?: string;
      walkTime: number;
      priceLevel: number;
      tags: string[];
      lastSelectedDate?: string;
      dietaryOptions: string[];
    }>
  >([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [address, setAddress] = useState("");
  const [walkTime, setWalkTime] = useState("10");
  const [priceLevel, setPriceLevel] = useState(2);
  const [tags, setTags] = useState("");
  const [dietaryOptions, setDietaryOptions] = useState("");

  const team = useQuery(api.teams.getTeam, teamId ? { teamId } : "skip");
  const updateTeam = useMutation(api.teams.updateTeam);

  useEffect(() => {
    if (team === undefined) return;
    if (!team) {
      router.push("/join");
      return;
    }
    setRestaurants(team.restaurants || []);
  }, [team, router]);

  const handleLoadShoreditchRestaurants = () => {
    const seededRestaurants = seedShoreditchRestaurants();
    setRestaurants(seededRestaurants);
  };

  const handleAddRestaurant = () => {
    if (!name.trim()) return;

    const newRestaurant = {
      id: generateId(),
      name: name.trim(),
      link: link.trim() || undefined,
      address: address.trim() || undefined,
      walkTime: Number.parseInt(walkTime) || 10,
      priceLevel,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      dietaryOptions: dietaryOptions
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
    };

    const updatedRestaurants = [...restaurants, newRestaurant];
    setRestaurants(updatedRestaurants);

    // Reset form
    setName("");
    setLink("");
    setAddress("");
    setWalkTime("10");
    setPriceLevel(2);
    setTags("");
    setDietaryOptions("");
    setShowAddForm(false);
  };

  const handleDeleteRestaurant = (id: string) => {
    setRestaurants(restaurants.filter((r) => r.id !== id));
  };

  const handleSave = async () => {
    if (!teamId || !team) return;

    await updateTeam({
      teamId,
      restaurants,
    });

    // Redirect to the team's vibe page
    router.push(`/team/${team.code}/vibe`);
  };

  if (!team) return null;

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Restaurant List</CardTitle>
            <CardDescription>
              Add restaurants your team can choose from. Include links, walk
              times, and tags.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {restaurants.length === 0 && (
              <Button
                variant="outline"
                className="w-full bg-primary/5 border-primary/20 hover:bg-primary/10"
                onClick={handleLoadShoreditchRestaurants}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Load Shoreditch Restaurants (346 Old St, London)
              </Button>
            )}

            {restaurants.length > 0 && (
              <div className="space-y-3">
                {restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{restaurant.name}</h3>
                        {restaurant.link && (
                          <a
                            href={restaurant.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{restaurant.walkTime} min walk</span>
                        <span>{"$".repeat(restaurant.priceLevel)}</span>
                      </div>
                      {restaurant.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {restaurant.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRestaurant(restaurant.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {showAddForm ? (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    placeholder="Joe's Pizza"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link">Link (optional)</Label>
                  <Input
                    id="link"
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="walk-time">Walk Time (minutes)</Label>
                    <Input
                      id="walk-time"
                      type="number"
                      value={walkTime}
                      onChange={(e) => setWalkTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price Level</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((level) => (
                        <Button
                          key={level}
                          type="button"
                          variant={priceLevel === level ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPriceLevel(level)}
                        >
                          {"$".repeat(level)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="italian, pizza, casual"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dietary">
                    Dietary Options (comma-separated)
                  </Label>
                  <Input
                    id="dietary"
                    placeholder="vegetarian, vegan, gluten-free"
                    value={dietaryOptions}
                    onChange={(e) => setDietaryOptions(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddRestaurant} disabled={!name.trim()}>
                    Add Restaurant
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Restaurant
              </Button>
            )}

            {restaurants.length > 0 && (
              <Button onClick={handleSave} className="w-full" size="lg">
                Continue to Preferences
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
