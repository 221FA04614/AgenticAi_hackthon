import { action } from "./_generated/server";
import { v } from "convex/values";

export const generateEventDescription = action({
  args: {
    eventTitle: v.string(),
    category: v.string(),
    basicDescription: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = `Generate an engaging and professional event description for the following event:

Title: ${args.eventTitle}
Category: ${args.category}
Basic Description: ${args.basicDescription || "Professional event"}
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

${args.basicDescription || "This carefully curated experience is designed for professionals and enthusiasts looking to expand their knowledge and connect with like-minded individuals."}

Our event promises to deliver valuable insights, networking opportunities, and practical takeaways that you can apply immediately.

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

export const generateEventTags = action({
  args: {
    eventTitle: v.string(),
    category: v.string(),
    description: v.string(),
    targetAudience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prompt = `Generate relevant tags for this event:

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
      console.error("Error generating event tags:", error);
      return {
        success: false,
        error: "Failed to generate tags",
      };
    }
  },
});
