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

// Generate finalists based on team vibes and preferences
export const generateFinalists = mutation({
  args: {
    sessionId: v.id("dailySessions"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Don't regenerate if finalists already exist
    if (session.finalists && session.finalists.length > 0) {
      return session.finalists;
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Get all users who submitted vibes
    const selectedVibes = (session.selectedVibes as Record<string, string[]>) || {};
    const userIds = Object.keys(selectedVibes);

    if (userIds.length === 0) {
      // No vibes submitted, randomly select 2 restaurants
      const shuffled = [...team.restaurants].sort(() => Math.random() - 0.5);
      const finalists = shuffled.slice(0, 2).map((r) => r.id);
      await ctx.db.patch(args.sessionId, { finalists });
      return finalists;
    }

    // Aggregate vibes from all users
    const vibeCount: Record<string, number> = {};
    Object.values(selectedVibes).forEach((vibes: string[]) => {
      vibes.forEach((vibe) => {
        vibeCount[vibe] = (vibeCount[vibe] || 0) + 1;
      });
    });

    // Get most popular vibes
    const topVibes = Object.entries(vibeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([vibe]) => vibe);

    // Filter restaurants based on team preferences
    // Get all team members' budgets and walk distances
    const users = await Promise.all(
      team.members.map((userId) => ctx.db.get(userId))
    );
    const validUsers = users.filter((u) => u !== null);

    // Calculate average/max constraints
    const avgBudget = validUsers.length > 0
      ? Math.ceil(validUsers.reduce((sum, u) => sum + (u?.budget || 2), 0) / validUsers.length)
      : 2;
    const maxWalkTime = validUsers.length > 0
      ? Math.max(...validUsers.map((u) => u?.maxWalkDistance || 15))
      : 15;

    // Filter eligible restaurants
    let eligible = team.restaurants.filter(
      (r) => r.walkTime <= maxWalkTime && r.priceLevel <= avgBudget
    );

    // Score restaurants based on matching vibes (tags)
    const scored = eligible.map((restaurant) => {
      let score = 0;
      topVibes.forEach((vibe) => {
        if (restaurant.tags.includes(vibe)) {
          score += 1;
        }
      });
      return { restaurant, score };
    });

    // Sort by score and select top 2
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreaker: prefer closer restaurants
      return a.restaurant.walkTime - b.restaurant.walkTime;
    });

    let finalistRestaurants = scored.slice(0, 2).map((s) => s.restaurant);

    // Fallback if not enough eligible
    if (finalistRestaurants.length === 0) {
      const shuffled = [...team.restaurants].sort(() => Math.random() - 0.5);
      finalistRestaurants = shuffled.slice(0, 2);
    } else if (finalistRestaurants.length === 1) {
      // Add one more random restaurant
      const remaining = team.restaurants.filter(
        (r) => r.id !== finalistRestaurants[0].id
      );
      const randomPick = remaining[Math.floor(Math.random() * remaining.length)];
      finalistRestaurants.push(randomPick);
    }

    const finalists = finalistRestaurants.map((r) => r.id);
    await ctx.db.patch(args.sessionId, { finalists });
    return finalists;
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

    // Validate phase transition if phase is being updated
    if (args.phase !== undefined && args.phase !== session.phase) {
      const validTransitions: Record<string, string[]> = {
        vibe: ["vote"],
        vote: ["result"],
        result: ["inactive"],
        inactive: ["vibe"],
      };

      const currentPhase = session.phase;
      const validNext = validTransitions[currentPhase] || [];

      if (!validNext.includes(args.phase)) {
        throw new Error(
          `Invalid phase transition from "${currentPhase}" to "${args.phase}"`
        );
      }
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
