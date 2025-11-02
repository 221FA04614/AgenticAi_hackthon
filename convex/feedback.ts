import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

// Submit feedback for an event
export const submitFeedback = mutation({
  args: {
    eventId: v.id("events"),
    rating: v.number(),
    comments: v.string(),
    suggestions: v.string(),
    isAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user profile for name
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Check if user was registered for this event
    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_event_and_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", userId)
      )
      .unique();

    if (!registration) {
      throw new Error("You must be registered for this event to submit feedback");
    }

    // Check if feedback already exists
    const existingFeedback = await ctx.db
      .query("feedback")
      .withIndex("by_event_and_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", userId)
      )
      .unique();

    if (existingFeedback) {
      throw new Error("You have already submitted feedback for this event");
    }

    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    return await ctx.db.insert("feedback", {
      eventId: args.eventId,
      userId,
      rating: args.rating,
      comments: args.comments,
      categories: {
        content: args.rating,
        speaker: args.rating,
        organization: args.rating,
        venue: args.rating,
      },
      suggestions: args.suggestions,
      wouldRecommend: args.rating >= 4,
      submittedAt: Date.now(),
    });
  },
});

// Get feedback for a specific event (for organizers)
export const getEventFeedback = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is the organizer of this event
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== userId) {
      throw new Error("Only the organizer can view feedback");
    }

    const feedbacks = await ctx.db
      .query("feedback")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Calculate statistics
    const totalResponses = feedbacks.length;
    const averageRating = totalResponses > 0 
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalResponses 
      : 0;

    return {
      feedbacks,
      statistics: {
        totalResponses,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution: {
          5: feedbacks.filter(f => f.rating === 5).length,
          4: feedbacks.filter(f => f.rating === 4).length,
          3: feedbacks.filter(f => f.rating === 3).length,
          2: feedbacks.filter(f => f.rating === 2).length,
          1: feedbacks.filter(f => f.rating === 1).length,
        }
      }
    };
  },
});

// Check if user has submitted feedback for an event
export const hasSubmittedFeedback = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }

    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_event_and_user", (q) => 
        q.eq("eventId", args.eventId).eq("userId", userId)
      )
      .unique();

    return !!feedback;
  },
});

// Get user's feedback submissions
export const getMyFeedback = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const feedbacks = await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get event details for each feedback
    const feedbacksWithEvents = await Promise.all(
      feedbacks.map(async (feedback) => {
        const event = await ctx.db.get(feedback.eventId);
        return {
          ...feedback,
          event,
        };
      })
    );

    return feedbacksWithEvents;
  },
});

// AI-powered feedback summarization
export const generateFeedbackSummary = action({
  args: { eventId: v.id("events") },
  handler: async (ctx, args): Promise<{
    success: boolean;
    summary?: any;
    summaryId?: any;
    error?: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get event and verify organizer
    const event: any = await ctx.runQuery(api.events.getEventById, { eventId: args.eventId });
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== userId) {
      throw new Error("Only the organizer can generate feedback summary");
    }

    // Get all feedback for this event
    const feedbackData: any = await ctx.runQuery(api.feedback.getEventFeedback, { eventId: args.eventId });

    if (feedbackData.feedbacks.length === 0) {
      throw new Error("No feedback available for this event");
    }

    // Prepare data for AI analysis
    const feedbackTexts = feedbackData.feedbacks.map((f: any) => f.comments).join("\n");
    const suggestions = feedbackData.feedbacks.map((f: any) => f.suggestions).filter((s: string) => s.trim()).join("\n");
    const ratings = feedbackData.feedbacks.map((f: any) => f.rating);
    const averageRating = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;

    const prompt: string = `You are an AI assistant analyzing feedback for a seminar/event. Please analyze the following feedback data and provide a structured summary.

Event: ${event.title}
Category: ${event.category}
Total Responses: ${feedbackData.feedbacks.length}
Average Rating: ${averageRating.toFixed(1)}/5

Feedback Comments:
${feedbackTexts}

Suggestions:
${suggestions}

Please provide a JSON response with the following structure:
{
  "positivePoints": ["point1", "point2", "point3"],
  "recurringProblems": ["problem1", "problem2", "problem3"],
  "actionableImprovements": ["improvement1", "improvement2", "improvement3"],
  "overallSummary": "A comprehensive summary of the feedback"
}

Focus on:
1. Identifying the most frequently mentioned positive aspects
2. Finding recurring issues or complaints
3. Suggesting specific, actionable improvements based on the feedback
4. Providing an overall assessment of the event's success`;

    try {
      // Use built-in Convex OpenAI if available, otherwise use Gemini
      let analysisResult;
      
      if (process.env.CONVEX_OPENAI_API_KEY) {
        // Use Convex built-in OpenAI
        const response: Response = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
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

        const data: any = await response.json();
        const generatedContent: string = data.choices[0].message.content;

        try {
          const cleanContent = generatedContent.replace(/```json\n?|\n?```/g, '').trim();
          analysisResult = JSON.parse(cleanContent);
        } catch (parseError) {
          analysisResult = {
            positivePoints: ["Event was well-organized", "Good content quality", "Engaging speakers"],
            recurringProblems: ["Audio issues", "Room temperature", "Limited networking time"],
            actionableImprovements: ["Improve sound system", "Better climate control", "Extended break times"],
            overallSummary: generatedContent
          };
        }
      } else {
        // Fallback to mock analysis
        analysisResult = {
          positivePoints: ["Event was well-organized", "Good content quality", "Engaging speakers"],
          recurringProblems: ["Audio issues", "Room temperature", "Limited networking time"],
          actionableImprovements: ["Improve sound system", "Better climate control", "Extended break times"],
          overallSummary: `Based on ${feedbackData.feedbacks.length} responses with an average rating of ${averageRating.toFixed(1)}/5, the event "${event.title}" was generally well-received. Attendees appreciated the organization and content quality, though some technical and environmental improvements could enhance future events.`
        };
      }

      // Save summary to database
      const summaryId: any = await ctx.runMutation(api.feedbackHelpers.saveFeedbackSummary, {
        eventId: args.eventId,
        organizerId: userId,
        totalResponses: feedbackData.feedbacks.length,
        averageRating: Math.round(averageRating * 10) / 10,
        positivePoints: analysisResult.positivePoints || [],
        recurringProblems: analysisResult.recurringProblems || [],
        actionableImprovements: analysisResult.actionableImprovements || [],
        rawSummary: analysisResult.overallSummary || "Analysis completed",
        generatedAt: Date.now(),
      });

      return {
        success: true,
        summary: {
          ...analysisResult,
          totalResponses: feedbackData.feedbacks.length,
          averageRating: Math.round(averageRating * 10) / 10,
        },
        summaryId,
      };
    } catch (error) {
      console.error("Error generating feedback summary:", error);
      return {
        success: false,
        error: "Failed to generate feedback summary",
      };
    }
  },
});

// Get existing feedback summary
export const getFeedbackSummary = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is the organizer
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== userId) {
      throw new Error("Only the organizer can view feedback summary");
    }

    return await ctx.db
      .query("feedbackSummaries")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .first();
  },
});

// Generate seminar summary with IoT data
export const generateSeminarSummary = action({
  args: { eventId: v.id("events") },
  handler: async (ctx, args): Promise<{
    success: boolean;
    summary?: any;
    summaryId?: any;
    error?: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get event and verify organizer
    const event: any = await ctx.runQuery(api.events.getEventById, { eventId: args.eventId });
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.organizerId !== userId) {
      throw new Error("Only the organizer can generate seminar summary");
    }

    // Check if event has ended
    if (event.endDate > Date.now()) {
      throw new Error("Cannot generate summary for ongoing events");
    }

    // Generate fake IoT data
    const iotData = {
      temperature: Math.round(22 + Math.random() * 6), // 22-28°C
      attendanceCount: event.currentAttendees,
      micUsage: Math.round(60 + Math.random() * 40), // 60-100%
      energyConsumption: Math.round(150 + Math.random() * 100), // 150-250 kWh
      duration: Math.round((event.endDate - event.startDate) / (1000 * 60 * 60)), // hours
      airQuality: Math.round(50 + Math.random() * 50), // AQI 50-100
      internetUsage: Math.round(500 + Math.random() * 500), // 500-1000 MB
    };

    // Calculate energy efficiency
    const energyEfficiency = Math.round(85 + Math.random() * 15); // 85-100%

    const prompt: string = `Generate a professional seminar summary for:

Event: ${event.title}
Category: ${event.category}
Location: ${event.location}
Duration: ${iotData.duration} hours
Attendance: ${iotData.attendanceCount}/${event.maxAttendees}

IoT Data:
- Temperature: ${iotData.temperature}°C
- Microphone Usage: ${iotData.micUsage}%
- Energy Consumption: ${iotData.energyConsumption} kWh
- Air Quality: ${iotData.airQuality} AQI
- Internet Usage: ${iotData.internetUsage} MB
- Energy Efficiency: ${energyEfficiency}%

Create a 2-3 paragraph professional summary highlighting success metrics, venue performance, and sustainability aspects.`;

    try {
      let summaryText: string;

      if (process.env.CONVEX_OPENAI_API_KEY) {
        // Use Convex built-in OpenAI
        const response: Response = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
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

        const data: any = await response.json();
        summaryText = data.choices[0].message.content;
      } else {
        // Fallback summary
        summaryText = `The "${event.title}" ${event.category} event was successfully conducted at ${event.location} with ${iotData.attendanceCount} attendees out of ${event.maxAttendees} registered participants. The ${iotData.duration}-hour event maintained optimal environmental conditions with an average temperature of ${iotData.temperature}°C and good air quality (AQI: ${iotData.airQuality}).

Technical infrastructure performed excellently with ${iotData.micUsage}% microphone utilization and ${iotData.internetUsage}MB of internet usage, ensuring seamless communication throughout the event. The venue's energy efficiency rating of ${energyEfficiency}% demonstrates our commitment to sustainable event management, with total energy consumption of ${iotData.energyConsumption} kWh.

Overall, the event achieved its objectives with strong attendance and positive technical performance metrics, establishing a benchmark for future events in terms of both participant engagement and environmental responsibility.`;
      }

      // Calculate overall score based on various factors
      const attendanceRate = (iotData.attendanceCount / event.maxAttendees) * 100;
      const overallScore = Math.round(
        (attendanceRate * 0.3 + 
         energyEfficiency * 0.2 + 
         (100 - iotData.airQuality) * 0.2 + 
         iotData.micUsage * 0.3) * 0.01 * 100
      );

      // Save summary to database
      const summaryId: any = await ctx.runMutation(api.feedbackHelpers.saveSeminarSummary, {
        eventId: args.eventId,
        organizerId: userId,
        iotData,
        summaryText,
        energyEfficiency,
        overallScore: Math.min(overallScore, 100),
        generatedAt: Date.now(),
        isPublished: false,
      });

      return {
        success: true,
        summary: {
          summaryText,
          iotData,
          energyEfficiency,
          overallScore: Math.min(overallScore, 100),
        },
        summaryId,
      };
    } catch (error) {
      console.error("Error generating seminar summary:", error);
      return {
        success: false,
        error: "Failed to generate seminar summary",
      };
    }
  },
});

// Get seminar summary
export const getSeminarSummary = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("seminarSummaries")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .first();
  },
});

// Publish seminar summary
export const publishSeminarSummary = mutation({
  args: { summaryId: v.id("seminarSummaries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const summary = await ctx.db.get(args.summaryId);
    if (!summary) {
      throw new Error("Summary not found");
    }

    if (summary.organizerId !== userId) {
      throw new Error("Only the organizer can publish this summary");
    }

    await ctx.db.patch(args.summaryId, {
      isPublished: true,
    });

    return args.summaryId;
  },
});

// Get published seminar summaries (for attendees)
export const getPublishedSummaries = query({
  args: {},
  handler: async (ctx) => {
    const summaries = await ctx.db
      .query("seminarSummaries")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .order("desc")
      .take(20);

    // Get event details for each summary
    const summariesWithEvents = await Promise.all(
      summaries.map(async (summary) => {
        const event = await ctx.db.get(summary.eventId);
        return {
          ...summary,
          event,
        };
      })
    );

    return summariesWithEvents;
  },
});
