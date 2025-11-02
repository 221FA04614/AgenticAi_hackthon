import { action } from "./_generated/server";
import { v } from "convex/values";

export const generateEventDescription = action({
  args: {
    eventTitle: v.string(),
    category: v.string(),
    basicDescription: v.string(),
    targetAudience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = `Generate an engaging and professional event description for the following event:

Title: ${args.eventTitle}
Category: ${args.category}
Basic Description: ${args.basicDescription}
Target Audience: ${args.targetAudience || "General audience"}

Please create a compelling description that includes:
- An attention-grabbing opening
- Key benefits for attendees
- What makes this event unique
- Call to action for registration

Keep it professional but engaging, around 150-200 words.`;

    try {
      let generatedContent: string;
      
      if (process.env.CONVEX_OPENAI_API_KEY) {
        // Use Convex built-in OpenAI
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
        // Fallback response when no AI API is available
        generatedContent = `Join us for an exciting ${args.category} event: "${args.eventTitle}"

${args.basicDescription}

This carefully curated experience is designed for ${args.targetAudience || "professionals and enthusiasts"} looking to expand their knowledge and connect with like-minded individuals. Our event promises to deliver valuable insights, networking opportunities, and practical takeaways that you can apply immediately.

What makes this event special:
• Expert speakers and industry leaders
• Interactive sessions and hands-on workshops  
• Networking opportunities with peers
• Latest trends and best practices in ${args.category}

Don't miss this opportunity to be part of something special. Register now to secure your spot and join us for an engaging and informative experience that will leave you inspired and equipped with new knowledge and connections.

Limited seats available - register today!`;
      }

      return {
        success: true,
        content: generatedContent,
      };
    } catch (error) {
      console.error("Error generating event description:", error);
      return {
        success: false,
        error: "Failed to generate event description",
      };
    }
  },
});

// New AI functions for proposals
export const generateProposalDescription = action({
  args: {
    eventTitle: v.string(),
    category: v.string(),
    targetAudience: v.string(),
    learningObjectives: v.string(),
    justification: v.string(),
  },
  handler: async (ctx, args) => {
    const prompt = `Generate a comprehensive and professional event proposal description for:

Title: ${args.eventTitle}
Category: ${args.category}
Target Audience: ${args.targetAudience}
Learning Objectives: ${args.learningObjectives}
Justification: ${args.justification}

Create a detailed proposal description that includes:
- Clear event overview and purpose
- Detailed learning outcomes and benefits
- Target audience analysis
- Value proposition for attendees
- Educational impact and relevance
- Professional tone suitable for administrative review

Keep it comprehensive but concise, around 200-300 words, suitable for proposal submission.`;

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
        // Fallback description
        generatedContent = `Proposal: ${args.eventTitle}

This ${args.category} event is designed to provide comprehensive learning opportunities for ${args.targetAudience}. The proposed session aims to deliver significant educational value through structured content delivery and interactive engagement.

Learning Outcomes:
${args.learningObjectives}

Educational Justification:
${args.justification}

The event will feature expert-led sessions, practical demonstrations, and collaborative learning opportunities. Participants will gain valuable insights, develop new skills, and expand their professional network within the ${args.category} domain.

Key Benefits:
• Structured learning experience with clear objectives
• Expert knowledge sharing and best practices
• Interactive sessions promoting active participation
• Networking opportunities with industry professionals
• Practical takeaways applicable to real-world scenarios

This event aligns with our educational mission to provide high-quality learning experiences that enhance participant knowledge and professional development. The proposed format ensures maximum engagement and learning retention through a combination of theoretical knowledge and practical application.

Expected Impact:
Participants will leave with enhanced understanding, practical skills, and valuable connections that will benefit their academic and professional growth.`;
      }

      return {
        success: true,
        content: generatedContent,
      };
    } catch (error) {
      console.error("Error generating proposal description:", error);
      return {
        success: false,
        error: "Failed to generate proposal description",
      };
    }
  },
});

export const generateProposalTags = action({
  args: {
    eventTitle: v.string(),
    category: v.string(),
    description: v.string(),
    targetAudience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = `Generate relevant tags for this event proposal:

Title: ${args.eventTitle}
Category: ${args.category}
Description: ${args.description}
Target Audience: ${args.targetAudience || "General"}

Generate 5-8 relevant tags that would help categorize and discover this event. Include:
- Category-specific tags
- Skill/topic tags
- Audience-specific tags
- Format/type tags

Return only the tags as a JSON array of strings, like: ["tag1", "tag2", "tag3"]`;

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

        // Try to parse JSON response
        try {
          const tags = JSON.parse(generatedContent);
          return {
            success: true,
            tags: Array.isArray(tags) ? tags : [],
          };
        } catch (parseError) {
          // If JSON parsing fails, extract tags from text
          const tagMatches = generatedContent.match(/"([^"]+)"/g);
          const extractedTags = tagMatches ? tagMatches.map(tag => tag.replace(/"/g, '')) : [];
          
          return {
            success: true,
            tags: extractedTags.length > 0 ? extractedTags : [args.category, "Professional Development", "Learning"],
          };
        }
      } else {
        // Fallback tags based on category and content
        const baseTags = [args.category, "Professional Development", "Learning"];
        
        // Add category-specific tags
        const categoryTags: Record<string, string[]> = {
          "Technology": ["Tech", "Innovation", "Digital"],
          "Business": ["Entrepreneurship", "Strategy", "Leadership"],
          "Health": ["Wellness", "Healthcare", "Medical"],
          "Education": ["Academic", "Teaching", "Research"],
          "Arts": ["Creative", "Culture", "Design"],
          "Sports": ["Fitness", "Athletics", "Competition"],
        };
        
        const additionalTags = categoryTags[args.category] || ["Workshop", "Seminar"];
        
        return {
          success: true,
          tags: [...baseTags, ...additionalTags].slice(0, 6),
        };
      }
    } catch (error) {
      console.error("Error generating proposal tags:", error);
      return {
        success: false,
        error: "Failed to generate tags",
      };
    }
  },
});

export const generateSocialPost = action({
  args: {
    eventTitle: v.string(),
    eventDescription: v.string(),
    eventDate: v.string(),
    eventLocation: v.string(),
    platform: v.union(v.literal("twitter"), v.literal("linkedin"), v.literal("facebook")),
  },
  handler: async (ctx, args) => {
    const platformGuidelines = {
      twitter: "Keep it under 280 characters, use relevant hashtags, make it engaging and shareable",
      linkedin: "Professional tone, 1-2 paragraphs, focus on networking and learning opportunities",
      facebook: "Friendly and engaging, can be longer, encourage sharing and tagging friends"
    };

    const prompt = `Create a ${args.platform} social media post for this event:

Title: ${args.eventTitle}
Description: ${args.eventDescription}
Date: ${args.eventDate}
Location: ${args.eventLocation}

Guidelines for ${args.platform}: ${platformGuidelines[args.platform]}

Include relevant hashtags and make it compelling for people to register and share.`;

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
        // Platform-specific fallback content
        const fallbacks = {
          twitter: `🎉 Excited to announce: ${args.eventTitle}! 
📅 ${args.eventDate}
📍 ${args.eventLocation}

Join us for an amazing experience! Register now 👇

#Event #${args.eventTitle.replace(/\s+/g, '')} #Networking #Learning`,

          linkedin: `I'm pleased to share an upcoming professional development opportunity:

${args.eventTitle}
📅 Date: ${args.eventDate}
📍 Location: ${args.eventLocation}

${args.eventDescription.substring(0, 200)}...

This is an excellent opportunity for networking and professional growth. I encourage my network to consider attending.

#ProfessionalDevelopment #Networking #${args.eventTitle.replace(/\s+/g, '')}`,

          facebook: `🌟 Don't miss out on this amazing event! 🌟

${args.eventTitle}
When: ${args.eventDate}
Where: ${args.eventLocation}

${args.eventDescription}

Tag your friends who would love this! Let's learn and grow together. 

Register now - link in comments! 

#Event #Community #Learning #${args.eventTitle.replace(/\s+/g, '')}`
        };
        
        generatedContent = fallbacks[args.platform];
      }

      return {
        success: true,
        content: generatedContent,
      };
    } catch (error) {
      console.error("Error generating social post:", error);
      return {
        success: false,
        error: "Failed to generate social post",
      };
    }
  },
});

export const generateSessionSummary = action({
  args: {
    sessionTitle: v.string(),
    sessionDescription: v.string(),
    speakerName: v.string(),
    sessionType: v.string(),
    keyPoints: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const keyPointsText = args.keyPoints ? 
      `Key points covered: ${args.keyPoints.join(", ")}` : 
      "No specific key points provided";

    const prompt = `Generate a comprehensive session summary for:

Session: ${args.sessionTitle}
Speaker: ${args.speakerName}
Type: ${args.sessionType}
Description: ${args.sessionDescription}
${keyPointsText}

Create a professional summary that includes:
- Overview of what was covered
- Key takeaways for attendees
- Main insights or learnings
- Any actionable items mentioned

Keep it informative and well-structured, around 200-300 words.`;

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
        generatedContent = `Session Summary: ${args.sessionTitle}

Speaker: ${args.speakerName}
Session Type: ${args.sessionType}

Overview:
${args.sessionDescription}

Key Takeaways:
${args.keyPoints ? args.keyPoints.map(point => `• ${point}`).join('\n') : '• Valuable insights shared by the speaker\n• Interactive discussion with attendees\n• Practical applications discussed'}

Main Insights:
The session provided attendees with practical knowledge and actionable insights. ${args.speakerName} delivered an engaging ${args.sessionType} that covered essential topics and encouraged active participation from the audience.

Actionable Items:
• Apply the concepts discussed in your daily work
• Connect with fellow attendees for continued learning
• Explore additional resources mentioned during the session
• Implement the best practices shared by the speaker

This session was well-received by attendees and provided valuable learning opportunities for professional development.`;
      }

      return {
        success: true,
        content: generatedContent,
      };
    } catch (error) {
      console.error("Error generating session summary:", error);
      return {
        success: false,
        error: "Failed to generate session summary",
      };
    }
  },
});

export const answerFAQ = action({
  args: {
    question: v.string(),
    eventContext: v.string(),
    eventDetails: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = `You are an AI assistant for an event management platform. Answer this attendee question about an event:

Question: ${args.question}
Event Context: ${args.eventContext}
Additional Event Details: ${args.eventDetails || "No additional details provided"}

Provide a helpful, accurate, and friendly response. If you don't have enough information to answer completely, suggest who they should contact for more details.

Keep the response concise but informative, around 100-150 words.`;

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
        // Fallback FAQ response
        generatedContent = `Thank you for your question about "${args.eventContext}".

Based on the information available, I'd be happy to help you with your inquiry. ${args.eventDetails ? `Here are the key details: ${args.eventDetails}` : ''}

For the most accurate and up-to-date information regarding your specific question: "${args.question}", I recommend contacting the event organizers directly. They will be able to provide you with detailed answers and any additional information you might need.

You can typically reach the organizers through:
• The event registration page
• The contact information provided in the event details
• The event management platform's messaging system

Is there anything else about the event that I can help clarify for you?`;
      }

      return {
        success: true,
        content: generatedContent,
      };
    } catch (error) {
      console.error("Error generating FAQ answer:", error);
      return {
        success: false,
        error: "Failed to generate FAQ answer",
      };
    }
  },
});

export const generateRecommendations = action({
  args: {
    userId: v.id("users"),
    userInterests: v.array(v.string()),
    attendedEvents: v.array(v.string()),
    availableEvents: v.array(v.object({
      id: v.string(),
      title: v.string(),
      category: v.string(),
      description: v.string(),
      tags: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const prompt = `Generate personalized event recommendations for a user based on their profile:

User Interests: ${args.userInterests.join(", ")}
Previously Attended Events: ${args.attendedEvents.join(", ")}

Available Events:
${args.availableEvents.map(event => 
  `- ${event.title} (${event.category}): ${event.description} [Tags: ${event.tags.join(", ")}]`
).join("\n")}

Analyze the user's interests and past attendance to recommend the most relevant events. For each recommendation, provide:
1. Event title
2. Relevance score (1-10)
3. Brief reason why it matches their interests

Return the response in this JSON format:
{
  "recommendations": [
    {
      "eventId": "event_id",
      "title": "Event Title",
      "score": 8,
      "reasons": ["reason1", "reason2"]
    }
  ]
}

Recommend up to 5 events, ordered by relevance score.`;

    try {
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
        const generatedContent = data.choices[0].message.content;

        // Try to parse JSON response
        try {
          const recommendations = JSON.parse(generatedContent);
          return {
            success: true,
            recommendations: recommendations.recommendations || [],
          };
        } catch (parseError) {
          // If JSON parsing fails, return a fallback response
          return {
            success: false,
            error: "Failed to parse recommendations",
          };
        }
      } else {
        // Fallback recommendation logic
        const recommendations = args.availableEvents
          .map(event => {
            let score = 0;
            const reasons = [];
            
            // Check interest matches
            const interestMatches = args.userInterests.filter(interest => 
              event.title.toLowerCase().includes(interest.toLowerCase()) ||
              event.category.toLowerCase().includes(interest.toLowerCase()) ||
              event.tags.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
            );
            
            if (interestMatches.length > 0) {
              score += interestMatches.length * 2;
              reasons.push(`Matches your interests: ${interestMatches.join(', ')}`);
            }
            
            // Check category relevance
            if (args.userInterests.some(interest => 
              event.category.toLowerCase().includes(interest.toLowerCase())
            )) {
              score += 3;
              reasons.push(`Relevant to your ${event.category} interests`);
            }
            
            // Add base score
            score += 3;
            
            return {
              eventId: event.id,
              title: event.title,
              score: Math.min(score, 10),
              reasons: reasons.length > 0 ? reasons : [`Great ${event.category} event`]
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        return {
          success: true,
          recommendations,
        };
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return {
        success: false,
        error: "Failed to generate recommendations",
      };
    }
  },
});
