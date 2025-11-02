import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    location: v.string(),
    isVirtual: v.boolean(),
    virtualLink: v.optional(v.string()),
    maxAttendees: v.number(),
    ticketPrice: v.number(),
    tags: v.array(v.string()),
    facilitiesRequired: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("events", {
      organizerId: userId,
      title: args.title,
      description: args.description,
      category: args.category,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      isVirtual: args.isVirtual,
      virtualLink: args.virtualLink,
      maxAttendees: args.maxAttendees,
      ticketPrice: args.ticketPrice,
      tags: args.tags,
      facilitiesRequired: args.facilitiesRequired,
      status: "draft",
    });
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    isVirtual: v.optional(v.boolean()),
    virtualLink: v.optional(v.string()),
    maxAttendees: v.optional(v.number()),
    ticketPrice: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== userId) {
      throw new Error("Not authorized to update this event");
    }

    const updateData: any = {};
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.startDate !== undefined) updateData.startDate = args.startDate;
    if (args.endDate !== undefined) updateData.endDate = args.endDate;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.isVirtual !== undefined) updateData.isVirtual = args.isVirtual;
    if (args.virtualLink !== undefined) updateData.virtualLink = args.virtualLink;
    if (args.maxAttendees !== undefined) updateData.maxAttendees = args.maxAttendees;
    if (args.ticketPrice !== undefined) updateData.ticketPrice = args.ticketPrice;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.eventId, updateData);
  },
});

export const publishEventFromProposal = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== userId) {
      throw new Error("Not authorized to publish this event");
    }

    await ctx.db.patch(args.eventId, {
      status: "published",
    });
  },
});

export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== userId) {
      throw new Error("Not authorized to delete this event");
    }

    await ctx.db.delete(args.eventId);
  },
});

export const getEventById = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

export const getEventWithOrganizer = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;
    
    const organizer = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", event.organizerId))
      .unique();
    
    return {
      ...event,
      organizer,
    };
  },
});

export const getPublishedEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .order("desc")
      .collect();
  },
});

export const getMyEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("events")
      .withIndex("by_organizer", (q) => q.eq("organizerId", userId))
      .order("desc")
      .collect();
  },
});

export const getEventsByCategory = query({
  args: {
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .collect();
  },
});

export const getUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("events")
      .withIndex("by_start_date")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "published"),
          q.gt(q.field("startDate"), now)
        )
      )
      .order("asc")
      .take(10);
  },
});

export const getPastEvents = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("events")
      .withIndex("by_start_date")
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "published"),
          q.lt(q.field("endDate"), now)
        )
      )
      .order("desc")
      .collect();
  },
});

export const searchEvents = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const searchTerm = args.searchTerm.toLowerCase();
    
    return events.filter(event => 
      event.title.toLowerCase().includes(searchTerm) ||
      event.description.toLowerCase().includes(searchTerm) ||
      event.category.toLowerCase().includes(searchTerm) ||
      event.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  },
});

// Add missing getEvents function for Dashboard
export const getEvents = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"), v.literal("completed"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      const events = await ctx.db
        .query("events")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
      
      if (args.limit) {
        return events.slice(0, args.limit);
      }
      
      return events;
    } else {
      const events = await ctx.db
        .query("events")
        .order("desc")
        .collect();
      
      if (args.limit) {
        return events.slice(0, args.limit);
      }
      
      return events;
    }
  },
});

// Add missing getMyRegistrations function
export const getMyRegistrations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get event details for each registration
    const eventsWithRegistrations = await Promise.all(
      registrations.map(async (registration) => {
        const event = await ctx.db.get(registration.eventId);
        return {
          ...registration,
          event,
        };
      })
    );

    return eventsWithRegistrations.filter(item => item.event !== null);
  },
});

// Re-export registration functions for convenience
export { registerForEvent, cancelRegistration } from "./registrations";
