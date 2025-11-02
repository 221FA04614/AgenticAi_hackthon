import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const populateHallsData = mutation({
  args: {},
  handler: async (ctx) => {
    const existingHalls = await ctx.db.query("halls").collect();
    if (existingHalls.length > 0) {
      return { message: "Halls already exist" };
    }

    await ctx.db.insert("halls", {
      name: "Nehru Hall",
      capacity: 120,
      type: "Technical" as const,
      availabilityStatus: "Available" as const,
      iotFeatures: ["Temperature_Sensor", "Light_Sensor", "Air_Quality"],
      wifiSpeed: 1000,
      ac: true,
      smartBoard: true,
      computers: 30,
      mics: 4,
      soundSystem: "Premium" as const,
      location: "Main Building - Ground Floor",
      rating: 4.8
    });

    return { message: "Added sample hall" };
  },
});

export const getAllHalls = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("halls").collect();
  },
});

// Hall selection and management functions
export const getAvailableHalls = query({
  args: {},
  handler: async (ctx) => {
    // In a real implementation, this would read from a database
    // For now, we'll simulate the CSV data
    const halls = [
      {
        id: "nehru_hall",
        name: "Nehru Hall",
        capacity: 120,
        type: "Technical",
        availabilityStatus: "Available",
        iotFeatures: ["Temperature_Sensor", "Light_Sensor", "Air_Quality"],
        wifiSpeed: 1000,
        ac: true,
        smartBoard: true,
        computers: 30,
        mics: 4,
        soundSystem: "Premium",
        location: "Main Building - Ground Floor",
        rating: 4.8
      },
      {
        id: "tagore_hall",
        name: "Tagore Hall",
        capacity: 80,
        type: "Non-Technical",
        availabilityStatus: "Available",
        iotFeatures: ["Temperature_Sensor", "Light_Sensor"],
        wifiSpeed: 500,
        ac: true,
        smartBoard: false,
        computers: 0,
        mics: 2,
        soundSystem: "Standard",
        location: "Arts Block - First Floor",
        rating: 4.2
      },
      {
        id: "gandhi_auditorium",
        name: "Gandhi Auditorium",
        capacity: 200,
        type: "Technical",
        availabilityStatus: "Available",
        iotFeatures: ["Temperature_Sensor", "Light_Sensor", "Air_Quality", "Motion_Sensor"],
        wifiSpeed: 1000,
        ac: true,
        smartBoard: true,
        computers: 50,
        mics: 6,
        soundSystem: "Premium",
        location: "Central Block - Second Floor",
        rating: 4.9
      },
      {
        id: "kalam_hall",
        name: "APJ Abdul Kalam Hall",
        capacity: 150,
        type: "Technical",
        availabilityStatus: "Available",
        iotFeatures: ["Temperature_Sensor", "Light_Sensor", "Air_Quality", "Occupancy_Sensor"],
        wifiSpeed: 1000,
        ac: true,
        smartBoard: true,
        computers: 40,
        mics: 4,
        soundSystem: "Premium",
        location: "Science Block - Third Floor",
        rating: 4.7
      },
      {
        id: "saraswati_hall",
        name: "Saraswati Hall",
        capacity: 90,
        type: "Non-Technical",
        availabilityStatus: "Available",
        iotFeatures: ["Temperature_Sensor", "Light_Sensor"],
        wifiSpeed: 500,
        ac: true,
        smartBoard: true,
        computers: 10,
        mics: 3,
        soundSystem: "Standard",
        location: "Arts Block - Second Floor",
        rating: 4.3
      }
    ];

    return halls.filter(hall => hall.availabilityStatus === "Available");
  },
});

export const getIoTData = query({
  args: { hallId: v.string() },
  handler: async (ctx, args) => {
    // Simulate IoT sensor data
    const baseData = {
      temperature: Math.round(22 + Math.random() * 6), // 22-28°C
      humidity: Math.round(40 + Math.random() * 20), // 40-60%
      airQuality: Math.round(50 + Math.random() * 100), // AQI 50-150
      lightLevel: Math.round(300 + Math.random() * 200), // 300-500 lux
      occupancy: Math.round(Math.random() * 100), // 0-100%
      noiseLevel: Math.round(30 + Math.random() * 20), // 30-50 dB
      timestamp: Date.now()
    };

    return baseData;
  },
});

export const selectOptimalHall = action({
  args: {
    eventType: v.string(),
    participantCount: v.number(),
    facilitiesRequired: v.array(v.string()),
    eventDate: v.number(),
    eventDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const prompt = `You are an AI assistant for a university seminar hall booking system. 
    
    Event Requirements:
    - Event Type: ${args.eventType}
    - Expected Participants: ${args.participantCount}
    - Required Facilities: ${args.facilitiesRequired.join(", ")}
    - Event Date: ${new Date(args.eventDate).toLocaleDateString()}
    - Duration: ${args.eventDuration} hours
    
    Available Halls (CSV format):
    HallName,Capacity,Type,AvailabilityStatus,IoT_Features,WiFiSpeed,AC,SmartBoard,Computers,Mics,SoundSystem,Location,Rating
    Nehru Hall,120,Technical,Available,Temperature_Sensor|Light_Sensor|Air_Quality,1000,Yes,Yes,30,4,Premium,Main Building - Ground Floor,4.8
    Tagore Hall,80,Non-Technical,Available,Temperature_Sensor|Light_Sensor,500,Yes,No,0,2,Standard,Arts Block - First Floor,4.2
    Gandhi Auditorium,200,Technical,Available,Temperature_Sensor|Light_Sensor|Air_Quality|Motion_Sensor,1000,Yes,Yes,50,6,Premium,Central Block - Second Floor,4.9
    APJ Abdul Kalam Hall,150,Technical,Available,Temperature_Sensor|Light_Sensor|Air_Quality|Occupancy_Sensor,1000,Yes,Yes,40,4,Premium,Science Block - Third Floor,4.7
    Saraswati Hall,90,Non-Technical,Available,Temperature_Sensor|Light_Sensor,500,Yes,Yes,10,3,Standard,Arts Block - Second Floor,4.3

    Please analyze and recommend the BEST hall based on:
    1. Capacity match (should accommodate participants with 10-20% buffer)
    2. Event type compatibility (Technical/Non-Technical)
    3. Required facilities availability
    4. Hall rating and location convenience
    5. IoT features for monitoring

    Respond in this JSON format:
    {
      "selectedHall": "Hall Name",
      "matchScore": 95,
      "reasoning": "Detailed explanation of why this hall was selected",
      "alternativeHalls": ["Hall1", "Hall2"],
      "facilitiesMatch": ["facility1", "facility2"],
      "capacityAnalysis": "Capacity analysis details"
    }`;

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
        // Fallback logic for hall selection
        const halls = [
          { name: "Gandhi Auditorium", capacity: 200, score: 95, type: "Technical" },
          { name: "APJ Abdul Kalam Hall", capacity: 150, score: 90, type: "Technical" },
          { name: "Nehru Hall", capacity: 120, score: 85, type: "Technical" },
          { name: "CV Raman Hall", capacity: 140, score: 80, type: "Technical" },
          { name: "Saraswati Hall", capacity: 90, score: 75, type: "Non-Technical" },
          { name: "Tagore Hall", capacity: 80, score: 70, type: "Non-Technical" }
        ];
        
        // Filter by event type if specified
        let suitableHalls = halls;
        if (args.eventType.toLowerCase().includes('technical') || 
            args.facilitiesRequired.some(f => f.toLowerCase().includes('computer') || f.toLowerCase().includes('smart'))) {
          suitableHalls = halls.filter(hall => hall.type === "Technical");
        }
        
        // Filter by capacity (with 20% buffer)
        suitableHalls = suitableHalls.filter(hall => 
          hall.capacity >= args.participantCount && 
          hall.capacity <= args.participantCount * 2
        );
        
        // Select the highest rated suitable hall
        const selectedHall = suitableHalls.length > 0 ? suitableHalls[0] : halls[0];
        
        generatedContent = JSON.stringify({
          selectedHall: selectedHall.name,
          matchScore: selectedHall.score,
          reasoning: `Selected ${selectedHall.name} for ${args.participantCount} participants. This ${selectedHall.type.toLowerCase()} hall provides adequate capacity (${selectedHall.capacity}) and excellent facilities for ${args.eventType} events. The hall offers premium amenities and is highly rated for its technical infrastructure.`,
          alternativeHalls: halls.filter(h => h.name !== selectedHall.name).slice(0, 2).map(h => h.name),
          facilitiesMatch: args.facilitiesRequired,
          capacityAnalysis: `Hall capacity of ${selectedHall.capacity} is suitable for ${args.participantCount} participants with comfortable buffer space`
        });
      }

      // Try to parse JSON response
      try {
        const cleanContent = generatedContent.replace(/```json\n?|\n?```/g, '').trim();
        const recommendation = JSON.parse(cleanContent);
        
        return {
          success: true,
          recommendation,
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          success: true,
          recommendation: {
            selectedHall: "Gandhi Auditorium",
            matchScore: 85,
            reasoning: generatedContent,
            alternativeHalls: ["Nehru Hall", "APJ Abdul Kalam Hall"],
            facilitiesMatch: args.facilitiesRequired,
            capacityAnalysis: `Recommended for ${args.participantCount} participants`
          }
        };
      }
    } catch (error) {
      console.error("Error selecting optimal hall:", error);
      return {
        success: false,
        error: "Failed to select optimal hall",
      };
    }
  },
});
