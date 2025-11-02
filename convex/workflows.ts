import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Proposal submission with LangGraph workflow
export const submitProposal = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    expectedAttendees: v.number(),
    preferredDate: v.number(),
    duration: v.number(),
    facilitiesRequired: v.array(v.string()),
    tags: v.array(v.string()),
    justification: v.string(),
    targetAudience: v.string(),
    learningObjectives: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user profile to ensure they're an organizer
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "organizer") {
      throw new Error("Only organizers can submit proposals");
    }

    // Create the proposal
    const proposalId = await ctx.db.insert("proposals", {
      organizerId: userId,
      title: args.title,
      description: args.description,
      category: args.category,
      expectedAttendees: args.expectedAttendees,
      preferredDate: args.preferredDate,
      duration: args.duration,
      facilitiesRequired: args.facilitiesRequired,
      tags: args.tags,
      justification: args.justification,
      targetAudience: args.targetAudience,
      learningObjectives: args.learningObjectives,
      status: "submitted",
      submittedAt: Date.now(),
    });

    // Trigger the LangGraph workflow
    await ctx.scheduler.runAfter(0, internal.workflowHelpers.processProposal, {
      proposalId,
    });

    return proposalId;
  },
});

// Get proposals for organizer
export const getMyProposals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("proposals")
      .withIndex("by_organizer", (q) => q.eq("organizerId", userId))
      .order("desc")
      .collect();
  },
});

// Get all proposals for admin
export const getAllProposals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const proposals = await ctx.db
      .query("proposals")
      .order("desc")
      .collect();

    // Get organizer details for each proposal
    const proposalsWithOrganizers = await Promise.all(
      proposals.map(async (proposal) => {
        const organizerProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", proposal.organizerId))
          .unique();
        
        return {
          ...proposal,
          organizerName: organizerProfile 
            ? `${organizerProfile.firstName} ${organizerProfile.lastName}`
            : "Unknown Organizer"
        };
      })
    );

    return proposalsWithOrganizers;
  },
});

// Admin approve/reject proposal
export const updateProposalStatus = mutation({
  args: {
    proposalId: v.id("proposals"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminComments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile || profile.role !== "admin") {
      throw new Error("Admin access required");
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // Update proposal status
    await ctx.db.patch(args.proposalId, {
      status: args.status,
      adminComments: args.adminComments,
      reviewedAt: Date.now(),
      reviewedBy: userId,
    });

    // If approved, create the event
    if (args.status === "approved") {
      await ctx.scheduler.runAfter(0, internal.workflowHelpers.createEventFromProposal, {
        proposalId: args.proposalId,
      });
    }

    return args.proposalId;
  },
});

// Get proposal details
export const getProposal = query({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      return null;
    }

    // Get organizer details
    const organizerProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", proposal.organizerId))
      .unique();

    return {
      ...proposal,
      organizerName: organizerProfile 
        ? `${organizerProfile.firstName} ${organizerProfile.lastName}`
        : "Unknown Organizer"
    };
  },
});
