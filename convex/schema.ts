import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  profiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("organizer"), v.literal("attendee"), v.literal("admin")),
    firstName: v.string(),
    lastName: v.string(),
    email: v.optional(v.string()),
    organization: v.optional(v.string()),
    bio: v.optional(v.string()),
    interests: v.optional(v.array(v.string())),
  }).index("by_user", ["userId"]),

  events: defineTable({
    organizerId: v.id("users"),
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
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"), v.literal("completed")),
    createdFromProposal: v.optional(v.id("proposals")),
  }).index("by_organizer", ["organizerId"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_start_date", ["startDate"]),

  registrations: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(v.literal("registered"), v.literal("cancelled"), v.literal("attended")),
    registeredAt: v.number(),
  }).index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_and_user", ["eventId", "userId"]),

  sessions: defineTable({
    eventId: v.id("events"),
    title: v.string(),
    description: v.string(),
    speakerName: v.string(),
    speakerBio: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
    sessionType: v.string(),
    maxAttendees: v.optional(v.number()),
  }).index("by_event", ["eventId"]),

  feedback: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    sessionId: v.optional(v.id("sessions")),
    rating: v.number(),
    comments: v.optional(v.string()),
    categories: v.object({
      content: v.number(),
      speaker: v.number(),
      organization: v.number(),
      venue: v.number(),
    }),
    suggestions: v.optional(v.string()),
    wouldRecommend: v.boolean(),
    submittedAt: v.number(),
  }).index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_and_user", ["eventId", "userId"]),

  halls: defineTable({
    name: v.string(),
    capacity: v.number(),
    type: v.union(v.literal("Technical"), v.literal("Non-Technical")),
    availabilityStatus: v.union(v.literal("Available"), v.literal("Occupied"), v.literal("Maintenance")),
    iotFeatures: v.array(v.string()),
    wifiSpeed: v.number(),
    ac: v.boolean(),
    smartBoard: v.boolean(),
    computers: v.number(),
    mics: v.number(),
    soundSystem: v.union(v.literal("Premium"), v.literal("Standard")),
    location: v.string(),
    rating: v.number(),
  }),

  // Feedback summaries table
  feedbackSummaries: defineTable({
    eventId: v.id("events"),
    organizerId: v.id("users"),
    totalResponses: v.number(),
    averageRating: v.number(),
    positivePoints: v.array(v.string()),
    recurringProblems: v.array(v.string()),
    actionableImprovements: v.array(v.string()),
    rawSummary: v.string(),
    generatedAt: v.number(),
  }).index("by_event", ["eventId"])
    .index("by_organizer", ["organizerId"]),

  // Seminar summaries table
  seminarSummaries: defineTable({
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
  }).index("by_event", ["eventId"])
    .index("by_organizer", ["organizerId"]),

  // New table for proposals
  proposals: defineTable({
    organizerId: v.id("users"),
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
    status: v.union(
      v.literal("submitted"), 
      v.literal("processing"), 
      v.literal("approved"), 
      v.literal("rejected")
    ),
    submittedAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    adminComments: v.optional(v.string()),
    
    // Workflow fields
    workflowStatus: v.optional(v.string()),
    workflowError: v.optional(v.string()),
    workflowCompletedAt: v.optional(v.number()),
    hallAvailability: v.optional(v.any()),
    aiSummary: v.optional(v.any()),
    
    // Link to created event
    createdEventId: v.optional(v.id("events")),
  }).index("by_organizer", ["organizerId"])
    .index("by_status", ["status"])
    .index("by_submitted_date", ["submittedAt"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
