import { internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// LangGraph workflow step 1: Process proposal and check hall availability
export const processProposal = internalAction({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    try {
      // Get proposal details
      const proposal = await ctx.runQuery(internal.workflowHelpers.getProposalDetailsForWorkflow, {
        proposalId: args.proposalId,
      });

      if (!proposal) {
        throw new Error("Proposal not found");
      }

      // Step 1: Check hall availability
      const hallAvailability = await ctx.runAction(internal.workflowHelpers.checkHallAvailability, {
        proposalId: args.proposalId,
        expectedAttendees: proposal.expectedAttendees,
        preferredDate: proposal.preferredDate,
        duration: proposal.duration,
        facilitiesRequired: proposal.facilitiesRequired,
      });

      // Step 2: Generate AI summary
      const aiSummary = await ctx.runAction(internal.workflowHelpers.generateProposalSummary, {
        proposalId: args.proposalId,
        proposal,
        hallAvailability,
      });

      // Step 3: Update proposal with workflow results
      await ctx.runMutation(internal.workflowHelpers.updateProposalWithWorkflowResults, {
        proposalId: args.proposalId,
        hallAvailability,
        aiSummary,
        workflowStatus: "completed",
      });

    } catch (error) {
      console.error("Workflow processing error:", error);
      
      // Update proposal with error status
      await ctx.runMutation(internal.workflowHelpers.updateProposalWithWorkflowResults, {
        proposalId: args.proposalId,
        hallAvailability: null,
        aiSummary: null,
        workflowStatus: "failed",
        workflowError: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

// Get proposal details for workflow
export const getProposalDetailsForWorkflow = internalQuery({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.proposalId);
  },
});

// Check hall availability using AI
export const checkHallAvailability = internalAction({
  args: {
    proposalId: v.id("proposals"),
    expectedAttendees: v.number(),
    preferredDate: v.number(),
    duration: v.number(),
    facilitiesRequired: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    // Get available halls
    const halls: any = await ctx.runQuery(internal.workflowHelpers.getAvailableHallsForWorkflow, {
      date: args.preferredDate,
    });

    // Use AI to select optimal hall
    const hallSelection: any = await ctx.runAction(api.halls.selectOptimalHall, {
      eventType: "Proposal Event",
      participantCount: args.expectedAttendees,
      facilitiesRequired: args.facilitiesRequired,
      eventDate: args.preferredDate,
      eventDuration: args.duration,
    });

    return {
      availableHalls: halls,
      recommendedHall: hallSelection.success ? hallSelection.recommendation : null,
      hallSelectionSuccess: hallSelection.success,
    };
  },
});

// Get available halls for a specific date (simplified for demo)
export const getAvailableHallsForWorkflow = internalQuery({
  args: { date: v.number() },
  handler: async (ctx, args) => {
    // In a real implementation, this would check actual bookings
    // For now, return all halls as available
    const halls = [
      { name: "Nehru Hall", capacity: 120, type: "Technical" },
      { name: "Tagore Hall", capacity: 80, type: "Non-Technical" },
      { name: "Gandhi Auditorium", capacity: 200, type: "Technical" },
      { name: "APJ Abdul Kalam Hall", capacity: 150, type: "Technical" },
      { name: "Saraswati Hall", capacity: 90, type: "Non-Technical" },
    ];

    return halls;
  },
});

// Generate AI summary of proposal
export const generateProposalSummary = internalAction({
  args: {
    proposalId: v.id("proposals"),
    proposal: v.any(),
    hallAvailability: v.any(),
  },
  handler: async (ctx, args) => {
    const prompt = `Analyze this event proposal and provide a comprehensive summary for admin review:

PROPOSAL DETAILS:
Title: ${args.proposal.title}
Category: ${args.proposal.category}
Expected Attendees: ${args.proposal.expectedAttendees}
Preferred Date: ${new Date(args.proposal.preferredDate).toLocaleDateString()}
Duration: ${args.proposal.duration} hours
Target Audience: ${args.proposal.targetAudience}
Learning Objectives: ${args.proposal.learningObjectives}
Justification: ${args.proposal.justification}
Required Facilities: ${args.proposal.facilitiesRequired.join(", ")}
Tags: ${args.proposal.tags.join(", ")}

HALL AVAILABILITY:
${args.hallAvailability.recommendedHall ? 
  `Recommended Hall: ${args.hallAvailability.recommendedHall.selectedHall}
   Match Score: ${args.hallAvailability.recommendedHall.matchScore}/100
   Reasoning: ${args.hallAvailability.recommendedHall.reasoning}` :
  "No optimal hall recommendation available"}

Please provide:
1. Executive Summary (2-3 sentences)
2. Strengths of the proposal
3. Potential concerns or areas for improvement
4. Hall suitability assessment
5. Overall recommendation (Approve/Needs Review/Reject) with reasoning

Format as a structured analysis for admin decision-making.`;

    try {
      let generatedContent: string;
      
      if (process.env.CONVEX_OPENAI_API_KEY) {
        const response = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1-nano",
            messages: [{ role: "user", content: prompt }],
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        generatedContent = data.choices[0].message.content;
      } else {
        // Fallback summary
        generatedContent = `EXECUTIVE SUMMARY:
The proposal "${args.proposal.title}" is a ${args.proposal.category} event targeting ${args.proposal.expectedAttendees} attendees. The event aims to provide valuable learning opportunities in the specified domain.

STRENGTHS:
• Clear event objectives and target audience
• Well-defined learning outcomes
• Appropriate duration (${args.proposal.duration} hours)
• Comprehensive facility requirements identified

POTENTIAL CONCERNS:
• Venue capacity and availability needs verification
• Resource allocation requirements
• Timeline feasibility assessment needed

HALL SUITABILITY:
${args.hallAvailability.recommendedHall ? 
  `Recommended venue: ${args.hallAvailability.recommendedHall.selectedHall} with ${args.hallAvailability.recommendedHall.matchScore}% compatibility` :
  "Hall availability requires further assessment"}

OVERALL RECOMMENDATION: NEEDS REVIEW
This proposal shows merit and aligns with educational objectives. Recommend admin review for final approval based on resource availability and strategic alignment.`;
      }

      return {
        success: true,
        summary: generatedContent,
      };
    } catch (error) {
      console.error("Error generating proposal summary:", error);
      return {
        success: false,
        error: "Failed to generate AI summary",
      };
    }
  },
});

// Update proposal with workflow results
export const updateProposalWithWorkflowResults = internalMutation({
  args: {
    proposalId: v.id("proposals"),
    hallAvailability: v.any(),
    aiSummary: v.any(),
    workflowStatus: v.string(),
    workflowError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.proposalId, {
      hallAvailability: args.hallAvailability,
      aiSummary: args.aiSummary,
      workflowStatus: args.workflowStatus,
      workflowError: args.workflowError,
      workflowCompletedAt: Date.now(),
    });
  },
});

// Create event from approved proposal
export const createEventFromProposal = internalAction({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args): Promise<any> => {
    const proposal: any = await ctx.runQuery(internal.workflowHelpers.getProposalDetailsForWorkflow, {
      proposalId: args.proposalId,
    });

    if (!proposal || proposal.status !== "approved") {
      throw new Error("Proposal not found or not approved");
    }

    // Create event from proposal
    const eventId: any = await ctx.runMutation(internal.workflowHelpers.createEventFromProposalData, {
      proposal,
    });

    // Update proposal with created event ID
    await ctx.runMutation(internal.workflowHelpers.linkProposalToEvent, {
      proposalId: args.proposalId,
      eventId,
    });

    return eventId;
  },
});

// Create event from proposal data
export const createEventFromProposalData = internalMutation({
  args: { proposal: v.any() },
  handler: async (ctx, args) => {
    const proposal = args.proposal;
    
    // Determine location from hall recommendation
    const location = proposal.hallAvailability?.recommendedHall?.selectedHall || "TBD";
    
    return await ctx.db.insert("events", {
      organizerId: proposal.organizerId,
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      startDate: proposal.preferredDate,
      endDate: proposal.preferredDate + (proposal.duration * 60 * 60 * 1000), // Add duration in milliseconds
      location,
      isVirtual: false,
      virtualLink: "",
      maxAttendees: proposal.expectedAttendees,
      ticketPrice: 0,
      tags: proposal.tags,
      facilitiesRequired: proposal.facilitiesRequired,
      status: "draft", // Created as draft, organizer can publish later
      createdFromProposal: proposal._id,
    });
  },
});

// Link proposal to created event
export const linkProposalToEvent = internalMutation({
  args: {
    proposalId: v.id("proposals"),
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.proposalId, {
      createdEventId: args.eventId,
    });
  },
});

// Get user's proposals
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
