/**
 * FILE: main.ts
 * PURPOSE: Main entry point for the Deno Oak server.
 */
import "dotenv";
import { Application, Router, send } from "oak";
import { CONFIG } from "./config.ts";
import { DB, Simulation } from "./db.ts";
import { AI } from "./ai.ts";

const app = new Application();
const router = new Router();

// --- API Routes ---

// List all
router.get("/api/simulations", async (ctx) => {
  ctx.response.body = await DB.listSimulations();
});

// Create new
router.post("/api/simulations", async (ctx) => {
  const body = await ctx.request.body().value;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newSim: Simulation = {
    id,
    title: body.title,
    createdAt: now,
    updatedAt: now,
    models: body.models.map((m: any) => ({
      ...m,
      config: CONFIG.MODELS.find(cfg => cfg.id === m.modelId)
    })),
    messages: []
  };

  await DB.saveSimulation(newSim);
  ctx.response.body = newSim;
});

// Get specific
router.get("/api/simulations/:id", async (ctx) => {
  const sim = await DB.getSimulation(ctx.params.id);
  if (!sim) return ctx.response.status = 404;
  ctx.response.body = sim;
});

// Single AI Message
router.post("/api/messages/:simId", async (ctx) => {
  const { modelId, message } = await ctx.request.body().value;
  const sim = await DB.getSimulation(ctx.params.simId);
  if (!sim) return ctx.response.status = 404;

  const model = sim.models.find(m => m.modelId === modelId);
  if (!model) return ctx.response.status = 400;

  // 1. Save user message
  await DB.addMessage(sim.id, { 
    role: "user", 
    content: message, 
    modelId, 
    timestamp: new Date().toISOString() 
  });

  // 2. Call AI
  const aiResponseText = await AI.chat(model.config.endpoint, sim.messages, model.roleName, sim.title);

  // 3. Save AI response
  const aiMsg = await DB.addMessage(sim.id, {
    role: "assistant",
    content: aiResponseText,
    modelId,
    timestamp: new Date().toISOString()
  });

  ctx.response.body = { modelId, message: aiMsg };
});

// Broadcast Message
router.post("/api/messages/:simId/broadcast", async (ctx) => {
  const { message } = await ctx.request.body().value;
  const sim = await DB.getSimulation(ctx.params.simId);
  if (!sim) return ctx.response.status = 404;

  // Save the shared user message
  await DB.addMessage(sim.id, { role: "user", content: message, timestamp: new Date().toISOString() });

  // Call all AIs in parallel
  const results = await Promise.all(sim.models.map(async (model) => {
    try {
      const text = await AI.chat(model.config.endpoint, sim.messages, model.roleName, sim.title);
      const msg = await DB.addMessage(sim.id, {
        role: "assistant",
        content: text,
        modelId: model.modelId,
        timestamp: new Date().toISOString()
      });
      return { modelId: model.modelId, message: msg };
    } catch (err) {
      return { modelId: model.modelId, error: err.message };
    }
  }));

  ctx.response.body = { results };
});

// Delete
router.delete("/api/simulations/:id", async (ctx) => {
  await DB.deleteSimulation(ctx.params.id);
  ctx.response.body = { success: true };
});

// --- Static Files & Middleware ---

app.use(router.routes());
app.use(router.allowedMethods());

// Serve static frontend files
app.use(async (ctx) => {
  await send(ctx, ctx.request.url.pathname, {
    root: `${Deno.cwd()}/public`,
    index: "index.html",
  });
});

console.log(`Server running at http://localhost:${CONFIG.PORT}`);
await app.listen({ port: CONFIG.PORT });