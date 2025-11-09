import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a unique 6-character team code
function generateTeamCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Create a new team
export const createTeam = mutation({
  args: {
    name: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Generate a unique code
    let code = generateTeamCode();
    let existingTeam = await ctx.db
      .query("teams")
      .withIndex("byCode", (q) => q.eq("code", code))
      .first();

    // Ensure code is unique
    while (existingTeam) {
      code = generateTeamCode();
      existingTeam = await ctx.db
        .query("teams")
        .withIndex("byCode", (q) => q.eq("code", code))
        .first();
    }

    const teamId = await ctx.db.insert("teams", {
      code,
      name: args.name,
      officeAddress: "",
      lunchWindowStart: "12:00",
      lunchWindowEnd: "12:30",
      members: [args.userId],
      restaurants: [],
      createdAt: Date.now(),
    });

    // Update user's teamId and isAdmin to maintain bidirectional relationship
    await ctx.db.patch(args.userId, {
      teamId: teamId,
      isAdmin: true, // Team creator is admin
    });

    return { teamId, code };
  },
});

// Get team by code
export const getTeamByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .withIndex("byCode", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
    return team;
  },
});

// Get team by ID
export const getTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.teamId);
  },
});

// Join a team
export const joinTeam = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user is already a member
    if (team.members.includes(args.userId)) {
      return team;
    }

    // Add user to members
    await ctx.db.patch(args.teamId, {
      members: [...team.members, args.userId],
    });

    // Update user's teamId
    await ctx.db.patch(args.userId, {
      teamId: args.teamId,
    });

    return await ctx.db.get(args.teamId);
  },
});

// Update team details
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    officeAddress: v.optional(v.string()),
    lunchWindowStart: v.optional(v.string()),
    lunchWindowEnd: v.optional(v.string()),
    restaurants: v.optional(
      v.array(
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
          pitch: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const updates: any = {};
    if (args.officeAddress !== undefined) {
      updates.officeAddress = args.officeAddress;
    }
    if (args.lunchWindowStart !== undefined) {
      updates.lunchWindowStart = args.lunchWindowStart;
    }
    if (args.lunchWindowEnd !== undefined) {
      updates.lunchWindowEnd = args.lunchWindowEnd;
    }
    if (args.restaurants !== undefined) {
      updates.restaurants = args.restaurants;
    }

    await ctx.db.patch(args.teamId, updates);
    return await ctx.db.get(args.teamId);
  },
});

// Add a restaurant to a team
export const addRestaurant = mutation({
  args: {
    teamId: v.id("teams"),
    restaurant: v.object({
      id: v.string(),
      name: v.string(),
      link: v.optional(v.string()),
      address: v.optional(v.string()),
      walkTime: v.number(),
      priceLevel: v.number(),
      tags: v.array(v.string()),
      dietaryOptions: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    await ctx.db.patch(args.teamId, {
      restaurants: [...team.restaurants, args.restaurant],
    });

    return await ctx.db.get(args.teamId);
  },
});

// Update a restaurant in a team
export const updateRestaurant = mutation({
  args: {
    teamId: v.id("teams"),
    restaurantId: v.string(),
    restaurant: v.object({
      id: v.string(),
      name: v.string(),
      link: v.optional(v.string()),
      address: v.optional(v.string()),
      walkTime: v.number(),
      priceLevel: v.number(),
      tags: v.array(v.string()),
      dietaryOptions: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const updatedRestaurants = team.restaurants.map((r) =>
      r.id === args.restaurantId ? args.restaurant : r
    );

    await ctx.db.patch(args.teamId, {
      restaurants: updatedRestaurants,
    });

    return await ctx.db.get(args.teamId);
  },
});

// Delete a restaurant from a team
export const deleteRestaurant = mutation({
  args: {
    teamId: v.id("teams"),
    restaurantId: v.string(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const updatedRestaurants = team.restaurants.filter(
      (r) => r.id !== args.restaurantId
    );

    await ctx.db.patch(args.teamId, {
      restaurants: updatedRestaurants,
    });

    return await ctx.db.get(args.teamId);
  },
});
