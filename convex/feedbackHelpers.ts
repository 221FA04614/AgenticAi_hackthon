import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper mutation to save feedback summary
export const saveFeedbackSummary = mutation({
  args: {
    eventId: v.id("events"),
    organizerId: v.id("users"),
    totalResponses: v.number(),
    averageRating: v.number(),
    positivePoints: v.array(v.string()),
    recurringProblems: v.array(v.string()),
    actionableImprovements: v.array(v.string()),
    rawSummary: v.string(),
    generatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("feedbackSummaries", args);
  },
});

// Helper mutation to save seminar summary
export const saveSeminarSummary = mutation({
  args: {
    eventId: v.id("events"),
    organizerId: v.id("users"),
    iotData: v.object({
      temperature: v.number(),
      attendanceCount: v.number(),
      micUsage: v.number(),
      energyConsumption: v.number(),
      duration: v.number(),
      airQuality: v.number(),
      internetUsage: v.number(),
    }),
    summaryText: v.string(),
    energyEfficiency: v.number(),
    overallScore: v.number(),
    generatedAt: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("seminarSummaries", args);
  },
});
