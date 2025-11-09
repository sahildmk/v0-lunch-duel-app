import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new daily session
export const createSession = mutation({
  args: {
    date: v.string(), // YYYY-MM-DD format
    teamId: v.id("teams"),
    vibeDeadline: v.number(), // timestamp
    voteDeadline: v.number(), // timestamp
  },
  handler: async (ctx, args) => {
    // Check if session already exists
    const existing = await ctx.db
      .query("dailySessions")
      .withIndex("byTeamAndDate", (q) =>
        q.eq("teamId", args.teamId).eq("date", args.date)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    const sessionId = await ctx.db.insert("dailySessions", {
      date: args.date,
      teamId: args.teamId,
      phase: "vibe",
      vibeDeadline: args.vibeDeadline,
      voteDeadline: args.voteDeadline,
      selectedVibes: {},
      votes: {},
      finalists: [],
    });

    return sessionId;
  },
});

// Get session by team and date
export const getSession = query({
  args: {
    teamId: v.id("teams"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailySessions")
      .withIndex("byTeamAndDate", (q) =>
        q.eq("teamId", args.teamId).eq("date", args.date)
      )
      .first();
  },
});

// Update session
export const updateSession = mutation({
  args: {
    sessionId: v.id("dailySessions"),
    phase: v.optional(
      v.union(
        v.literal("vibe"),
        v.literal("vote"),
        v.literal("result"),
        v.literal("inactive")
      )
    ),
    selectedVibes: v.optional(v.any()),
    votes: v.optional(v.any()),
    winnerId: v.optional(v.string()),
    finalists: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const updates: any = {};
    if (args.phase !== undefined) {
      updates.phase = args.phase;
    }
    if (args.selectedVibes !== undefined) {
      updates.selectedVibes = args.selectedVibes;
    }
    if (args.votes !== undefined) {
      updates.votes = args.votes;
    }
    if (args.winnerId !== undefined) {
      updates.winnerId = args.winnerId;
    }
    if (args.finalists !== undefined) {
      updates.finalists = args.finalists;
    }

    await ctx.db.patch(args.sessionId, updates);
    return await ctx.db.get(args.sessionId);
  },
});
