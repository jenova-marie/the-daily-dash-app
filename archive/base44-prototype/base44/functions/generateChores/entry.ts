import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { room, choreType, ageGroup, quantity, mealType } = await req.json();
    
    if (!choreType || !ageGroup) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (choreType !== "Meal" && !room) {
      return Response.json({ error: 'Room is required for non-meal chores' }, { status: 400 });
    }

    const ageDescription = {
      "3-5": "toddlers and preschoolers (3-5 years old)",
      "5-7": "young children (5-7 years old)",
      "8-10": "children (8-10 years old)",
      "11-13": "pre-teens (11-13 years old)",
      "14-17": "teenagers (14-17 years old)",
      "18+": "young adults (18+ years old)",
      "Adult": "adults"
    }[ageGroup] || "people";

    const isMeal = choreType === "Meal";
    const prompt = isMeal
      ? `Generate ${quantity || 5} age-appropriate ${mealType} meal ideas for ${ageDescription}.

For each meal idea, provide:
- Title: The name of the meal
- Description: 2-3 sentences describing the meal, key ingredients, and why it's suitable for this age group
- Frequency: How often this could be served (daily, weekly, biweekly, or monthly)
- Time Estimate: Estimated prep + cook time in minutes (e.g., "15", "30", "45", "60")
- Priority: Use "medium" for most meals, "high" for nutrient-dense options, "low" for occasional treats

Make sure meals are age-appropriate. Simple, fun foods for young children; more varied and nutritious options for teens and adults.

Format as a JSON array with objects containing: { title, description, frequency, time_estimate, priority }`
      : `Generate ${quantity || 5} age-appropriate chore ideas for ${ageDescription} in the ${room} room, specifically focused on ${choreType} tasks.
    
For each chore, provide:
- Title: A clear, concise chore name
- Description: 2-3 sentences about what the chore involves
- Frequency: How often it should be done (daily, weekly, biweekly, or monthly)
- Time Estimate: Estimated minutes to complete (e.g., "15", "30", "45", "60")
- Priority: Low, medium, or high priority for this room

Format as a JSON array with objects containing: { title, description, frequency, time_estimate, priority }

Make sure the chores are appropriate for the age group. Younger kids (5-7) should have simple, safe tasks. Older teens and adults can handle more complex responsibilities.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          chores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                 title: { type: "string" },
                 description: { type: "string" },
                 frequency: { type: "string" },
                 time_estimate: { type: "string" },
                 priority: { type: "string" }
               },
               required: ["title", "description", "frequency", "time_estimate", "priority"]
            }
          }
        },
        required: ["chores"]
      }
    });

    return Response.json({ chores: result.chores || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});