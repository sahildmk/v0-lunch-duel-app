import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get loyalty cards for a team
export const getLoyaltyCards = query({
    args: { teamId: v.id("teams") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("loyaltyCards")
            .withIndex("byTeamAndRestaurant", (q) => q.eq("teamId", args.teamId))
            .collect();
    },
});

// Get loyalty card for a specific restaurant
export const getLoyaltyCard = query({
    args: {
        teamId: v.id("teams"),
        restaurantId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("loyaltyCards")
            .withIndex("byTeamAndRestaurant", (q) =>
                q.eq("teamId", args.teamId).eq("restaurantId", args.restaurantId)
            )
            .first();
    },
});

// Create or update loyalty card
export const upsertLoyaltyCard = mutation({
    args: {
        teamId: v.id("teams"),
        restaurantId: v.string(),
        perks: v.string(),
        savings: v.optional(v.number()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if card already exists
        const existing = await ctx.db
            .query("loyaltyCards")
            .withIndex("byTeamAndRestaurant", (q) =>
                q.eq("teamId", args.teamId).eq("restaurantId", args.restaurantId)
            )
            .first();

        if (existing) {
            // Update existing card
            await ctx.db.patch(existing._id, {
                perks: args.perks,
                savings: args.savings,
                notes: args.notes,
            });
            return existing._id;
        } else {
            // Create new card
            return await ctx.db.insert("loyaltyCards", {
                teamId: args.teamId,
                restaurantId: args.restaurantId,
                perks: args.perks,
                savings: args.savings,
                notes: args.notes,
                createdAt: Date.now(),
            });
        }
    },
});

// Delete loyalty card
export const deleteLoyaltyCard = mutation({
    args: { cardId: v.id("loyaltyCards") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.cardId);
    },
});

