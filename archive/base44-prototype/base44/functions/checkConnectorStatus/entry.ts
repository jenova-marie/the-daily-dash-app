import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const connectorId = (body.args ?? body).connectorId;

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ connected: false });
    }

    if (!connectorId) {
      return Response.json({ connected: false });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId);
    return Response.json({ connected: !!(accessToken) });
  } catch (error) {
    return Response.json({ connected: false });
  }
});