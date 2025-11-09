import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get discounts for a restaurant
export const getDiscounts = query({
    args: {
        teamId: v.id("teams"),
        restaurantId: v.string(),
    },
    handler: async (ctx, args) => {
        const discounts = await ctx.db
            .query("discounts")
            .withIndex("byTeamAndRestaurant", (q) =>
                q.eq("teamId", args.teamId).eq("restaurantId", args.restaurantId)
            )
            .collect();

        // Filter out expired discounts
        const today = new Date().toISOString().split("T")[0];
        return discounts.filter(
            (discount) => !discount.expirationDate || discount.expirationDate >= today
        );
    },
});

// Get all discounts for a team
export const getTeamDiscounts = query({
    args: { teamId: v.id("teams") },
    handler: async (ctx, args) => {
        const discounts = await ctx.db
            .query("discounts")
            .withIndex("byTeamAndRestaurant", (q) => q.eq("teamId", args.teamId))
            .collect();

        // Filter out expired discounts
        const today = new Date().toISOString().split("T")[0];
        return discounts.filter(
            (discount) => !discount.expirationDate || discount.expirationDate >= today
        );
    },
});

// Create a discount
export const createDiscount = mutation({
    args: {
        teamId: v.id("teams"),
        restaurantId: v.string(),
        discount: v.string(),
        amount: v.optional(v.number()),
        discountType: v.union(v.literal("percentage"), v.literal("fixed")),
        expirationDate: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("discounts", {
            teamId: args.teamId,
            restaurantId: args.restaurantId,
            discount: args.discount,
            amount: args.amount,
            discountType: args.discountType,
            expirationDate: args.expirationDate,
            notes: args.notes,
            createdAt: Date.now(),
        });
    },
});

// Update a discount
export const updateDiscount = mutation({
    args: {
        discountId: v.id("discounts"),
        discount: v.string(),
        amount: v.optional(v.number()),
        discountType: v.union(v.literal("percentage"), v.literal("fixed")),
        expirationDate: v.optional(v.string()),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { discountId, ...updates } = args;
        await ctx.db.patch(discountId, updates);
    },
});

// Delete a discount
export const deleteDiscount = mutation({
    args: { discountId: v.id("discounts") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.discountId);
    },
});

