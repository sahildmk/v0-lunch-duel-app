import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get pitches for a restaurant
export const getPitches = query({
    args: {
        teamId: v.id("teams"),
        restaurantId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("pitches")
            .withIndex("byTeamAndRestaurant", (q) =>
                q.eq("teamId", args.teamId).eq("restaurantId", args.restaurantId)
            )
            .collect();
    },
});

// Get all pitches for a team
export const getTeamPitches = query({
    args: { teamId: v.id("teams") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("pitches")
            .withIndex("byTeamAndRestaurant", (q) => q.eq("teamId", args.teamId))
            .collect();
    },
});

// Get user's pitch for a restaurant
export const getUserPitch = query({
    args: {
        teamId: v.id("teams"),
        restaurantId: v.string(),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("pitches")
            .withIndex("byUserAndRestaurant", (q) =>
                q.eq("userId", args.userId).eq("restaurantId", args.restaurantId)
            )
            .filter((q) => q.eq(q.field("teamId"), args.teamId))
            .first();
    },
});

// Create or update a pitch
export const upsertPitch = mutation({
    args: {
        teamId: v.id("teams"),
        restaurantId: v.string(),
        userId: v.id("users"),
        pitch: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if pitch already exists
        const existing = await ctx.db
            .query("pitches")
            .withIndex("byUserAndRestaurant", (q) =>
                q.eq("userId", args.userId).eq("restaurantId", args.restaurantId)
            )
            .filter((q) => q.eq(q.field("teamId"), args.teamId))
            .first();

        if (existing) {
            // Update existing pitch
            await ctx.db.patch(existing._id, {
                pitch: args.pitch,
            });
            return existing._id;
        } else {
            // Create new pitch
            return await ctx.db.insert("pitches", {
                teamId: args.teamId,
                restaurantId: args.restaurantId,
                userId: args.userId,
                pitch: args.pitch,
                createdAt: Date.now(),
            });
        }
    },
});

// Delete a pitch
export const deletePitch = mutation({
    args: { pitchId: v.id("pitches") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.pitchId);
    },
});

