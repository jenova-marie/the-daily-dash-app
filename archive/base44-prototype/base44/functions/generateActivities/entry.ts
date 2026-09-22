import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ageGroup, subject, activityType, quantity } = await req.json();
    
    if (!ageGroup || !subject || !activityType) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `Generate ${quantity || 5} creative, age-appropriate ${activityType} activities for students in ${ageGroup} learning about ${subject}.
    
For each activity, provide:
- Title: A clear, catchy name
- Description: 1-2 sentences about what the activity involves
- Duration: Estimated time to complete (e.g., "30 minutes")
- Materials: Any supplies needed (or "None" if just paper/pencil)

Format as a JSON array with objects containing: { title, description, duration, materials }

Make them engaging, hands-on, and appropriate for the age group.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
     prompt,
     response_json_schema: {
       type: "object",
       properties: {
         activities: {
           type: "array",
           items: {
             type: "object",
             properties: {
                title: { type: "string" },
                description: { type: "string" },
                duration: { type: "string" },
                materials: { type: "string" }
                },
                required: ["title", "description", "duration", "materials"]
           }
         }
       },
       required: ["activities"]
     }
    });

    return Response.json({ activities: result.activities || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});