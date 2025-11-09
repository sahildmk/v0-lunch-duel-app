import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Record a visit to a restaurant
export const recordVisit = mutation({
    args: {
        teamId: v.id("teams"),
        restaurantId: v.string(),
        date: v.string(), // YYYY-MM-DD format
        sessionId: v.id("dailySessions"),
    },
    handler: async (ctx, args) => {
        // Check if visit already recorded for this date
        const existing = await ctx.db
            .query("visitHistory")
            .withIndex("byTeamAndRestaurant", (q) =>
                q.eq("teamId", args.teamId).eq("restaurantId", args.restaurantId)
            )
            .filter((q) => q.eq(q.field("date"), args.date))
            .first();

        if (existing) {
            return existing._id; // Already recorded
        }

        return await ctx.db.insert("visitHistory", {
            teamId: args.teamId,
            restaurantId: args.restaurantId,
            date: args.date,
            sessionId: args.sessionId,
            createdAt: Date.now(),
        });
    },
});

// Get visit history for a team
export const getVisitHistory = query({
    args: { teamId: v.id("teams") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("visitHistory")
            .withIndex("byTeamAndRestaurant", (q) => q.eq("teamId", args.teamId))
            .collect();
    },
});

// Get visit count per restaurant for a team
export const getVisitCounts = query({
    args: { teamId: v.id("teams") },
    handler: async (ctx, args) => {
        const visits = await ctx.db
            .query("visitHistory")
            .withIndex("byTeamAndRestaurant", (q) => q.eq("teamId", args.teamId))
            .collect();

        // Count visits per restaurant
        const counts: Record<string, number> = {};
        visits.forEach((visit) => {
            counts[visit.restaurantId] = (counts[visit.restaurantId] || 0) + 1;
        });

        return counts;
    },
});

// Get visit history for a specific restaurant
export const getRestaurantVisits = query({
    args: {
        teamId: v.id("teams"),
        restaurantId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("visitHistory")
            .withIndex("byTeamAndRestaurant", (q) =>
                q.eq("teamId", args.teamId).eq("restaurantId", args.restaurantId)
            )
            .order("desc")
            .collect();
    },
});

