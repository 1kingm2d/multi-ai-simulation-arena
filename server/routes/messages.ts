/**
 * FILE: server/routes/messages.ts
 * PURPOSE: Message broadcasting and individual handling
 */
import { Router } from "oak";
import { DB } from "../db/kv.ts";
import { callModel } from "../services/openRouter.ts";
import { prepareContext } from "../services/memoryManager.ts";
import { SYSTEM_PROMPT_TEMPLATE, MODELS } from "../config.ts";

const router = new Router();

router.post("/api/messages/:simulationId/broadcast", async (ctx) => {
  const { simulationId } = ctx.params;
  const { message } = await ctx.request.body().value;
  const sim = await DB.getSimulation(simulationId);
  
  if (!sim) { ctx.response.status = 404; return; }

  sim.messages.push({ id: crypto.randomUUID(), role: 'user', content: message, timestamp: Date.now() });

  const results = await Promise.allSettled(sim.models.map(async (assignment) => {
    const context = await prepareContext(sim);
    context.unshift({ role: 'system', content: SYSTEM_PROMPT_TEMPLATE(sim.title, assignment.roleName) });
    
    const response = await callModel(assignment.openRouterModelId, context);
    const aiMsg = { id: crypto.randomUUID(), role: 'assistant' as const, modelId: assignment.id, content: response.choices[0].message.content, timestamp: Date.now() };
    return { modelId: assignment.id, message: aiMsg };
  }));

  const validResponses = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
  validResponses.forEach(r => sim.messages.push(r!.message));
  
  await DB.saveSimulation(sim);
  ctx.response.body = { results: validResponses };
});

export default router;