// Type definitions for Lunch Duel
// Note: Data is now persisted in Convex database, not localStorage

export interface User {
  id: string;
  name: string;
  teamId: string;
  dietaryRestrictions: string[];
  budget: number; // 1-3 scale ($, $$, $$$)
  maxWalkDistance: number; // in minutes
  vibes: {
    rushMode: boolean;
    spicy: boolean;
    tryingNew: boolean;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  link?: string;
  address?: string;
  walkTime: number; // minutes from office
  priceLevel: number; // 1-3
  tags: string[]; // cuisine type, vibes, etc
  lastSelectedDate?: string;
  dietaryOptions: string[]; // vegetarian, vegan, gluten-free, etc
}

export interface Team {
  id: string;
  code: string;
  name: string;
  officeAddress: string;
  lunchWindowStart: string; // HH:MM format
  lunchWindowEnd: string; // HH:MM format
  members: string[]; // user IDs
  restaurants: Restaurant[];
}

export interface DailySession {
  date: string;
  teamId: string;
  phase: "vibe" | "vote" | "result" | "inactive";
  vibeDeadline: string; // ISO timestamp
  voteDeadline: string; // ISO timestamp
  selectedVibes: Record<string, string[]>; // userId -> vibes
  votes: Record<string, Record<string, number>>; // userId -> restaurantId -> score
  winnerId?: string;
  finalists: string[]; // restaurant IDs
}

// Utility functions
export function generateTeamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
