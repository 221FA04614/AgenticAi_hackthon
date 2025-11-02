import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const registerForEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_event_and_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", userId))
      .unique();

    if (existing) throw new Error("Already registered");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("status"), "registered"))
      .collect();

    if (registrations.length >= event.maxAttendees) {
      throw new Error("Event is full");
    }

    return await ctx.db.insert("registrations", {
      eventId: args.eventId,
      userId,
      status: "registered",
      registeredAt: Date.now(),
    });
  },
});

export const cancelRegistration = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_event_and_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", userId))
      .unique();

    if (!registration) throw new Error("Registration not found");

    await ctx.db.patch(registration._id, { status: "cancelled" });
  },
});
