import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a unique user ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a new user
export const createUser = mutation({
  args: {
    name: v.string(),
    teamId: v.optional(v.id("teams")),
    dietaryRestrictions: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
    maxWalkDistance: v.optional(v.number()),
    vibes: v.optional(
      v.object({
        rushMode: v.boolean(),
        spicy: v.boolean(),
        tryingNew: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      name: args.name,
      teamId: args.teamId,
      dietaryRestrictions: args.dietaryRestrictions || [],
      budget: args.budget ?? 2,
      maxWalkDistance: args.maxWalkDistance ?? 15,
      vibes: args.vibes || {
        rushMode: false,
        spicy: false,
        tryingNew: false,
      },
    });
    return userId;
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get all users by their IDs
export const getUsersByIds = query({
  args: { userIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const users = await Promise.all(
      args.userIds.map((userId) => ctx.db.get(userId))
    );
    return users.filter((user) => user !== null);
  },
});

// Update user preferences
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    dietaryRestrictions: v.optional(v.array(v.string())),
    budget: v.optional(v.number()),
    maxWalkDistance: v.optional(v.number()),
    vibes: v.optional(
      v.object({
        rushMode: v.boolean(),
        spicy: v.boolean(),
        tryingNew: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const updates: any = {};
    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.dietaryRestrictions !== undefined) {
      updates.dietaryRestrictions = args.dietaryRestrictions;
    }
    if (args.budget !== undefined) {
      updates.budget = args.budget;
    }
    if (args.maxWalkDistance !== undefined) {
      updates.maxWalkDistance = args.maxWalkDistance;
    }
    if (args.vibes !== undefined) {
      updates.vibes = args.vibes;
    }

    await ctx.db.patch(args.userId, updates);
    return await ctx.db.get(args.userId);
  },
});
