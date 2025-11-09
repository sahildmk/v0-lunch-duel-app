import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  teams: defineTable({
    code: v.string(),
    name: v.string(),
    officeAddress: v.string(),
    lunchWindowStart: v.string(), // HH:MM format
    lunchWindowEnd: v.string(), // HH:MM format
    members: v.array(v.id("users")),
    restaurants: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        link: v.optional(v.string()),
        address: v.optional(v.string()),
        walkTime: v.number(),
        priceLevel: v.number(),
        tags: v.array(v.string()),
        lastSelectedDate: v.optional(v.string()),
        dietaryOptions: v.array(v.string()),
      })
    ),
    createdAt: v.number(),
  }).index("byCode", ["code"]),

  users: defineTable({
    name: v.string(),
    teamId: v.optional(v.id("teams")),
    isAdmin: v.optional(v.boolean()), // true if user is team creator/admin
    dietaryRestrictions: v.array(v.string()),
    budget: v.number(), // 1-3 scale
    maxWalkDistance: v.number(), // in minutes
    vibes: v.object({
      rushMode: v.boolean(),
      spicy: v.boolean(),
      tryingNew: v.boolean(),
    }),
  }),

  dailySessions: defineTable({
    date: v.string(), // YYYY-MM-DD format
    teamId: v.id("teams"),
    phase: v.union(
      v.literal("vibe"),
      v.literal("vote"),
      v.literal("result"),
      v.literal("inactive")
    ),
    vibeDeadline: v.number(), // timestamp
    voteDeadline: v.number(), // timestamp
    selectedVibes: v.any(), // Record<string, string[]>
    votes: v.any(), // Record<string, Record<string, number>>
    winnerId: v.optional(v.string()),
    finalists: v.array(v.string()), // restaurant IDs
  }).index("byTeamAndDate", ["teamId", "date"]),
});
