import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createSession = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    description: v.string(),
    speakerName: v.string(),
    speakerBio: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
    sessionType: v.union(v.literal("keynote"), v.literal("workshop"), v.literal("panel"), v.literal("networking")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is the organizer of the event
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== userId) {
      throw new Error("Only the event organizer can create sessions");
    }

    return await ctx.db.insert("sessions", args);
  },
});

export const updateSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    speakerName: v.optional(v.string()),
    speakerBio: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    location: v.optional(v.string()),
    sessionType: v.optional(v.union(v.literal("keynote"), v.literal("workshop"), v.literal("panel"), v.literal("networking"))),
    aiSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check if user is the organizer of the event
    const event = await ctx.db.get(session.eventId);
    if (!event || event.organizerId !== userId) {
      throw new Error("Only the event organizer can update sessions");
    }

    const { sessionId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(sessionId, filteredUpdates);
    return sessionId;
  },
});

export const getSessionsByEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("asc")
      .collect();
  },
});

export const deleteSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Check if user is the organizer of the event
    const event = await ctx.db.get(session.eventId);
    if (!event || event.organizerId !== userId) {
      throw new Error("Only the event organizer can delete sessions");
    }

    await ctx.db.delete(args.sessionId);
    return args.sessionId;
  },
});
