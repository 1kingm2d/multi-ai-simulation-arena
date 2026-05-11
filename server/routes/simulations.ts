/**
 * FILE: server/routes/simulations.ts
 * PURPOSE: CRUD operations for simulations
 */
import { Router } from "oak";
import { DB } from "../db/kv.ts";
import { MODELS, SYSTEM_PROMPT_TEMPLATE } from "../config.ts";

const router = new Router();

/* GET all simulations */
router.get("/api/simulations", async (ctx) => {
  const sims = await DB.listSimulations();
  ctx.response.body = sims.map(s => ({
    id: s.id,
    title: s.title,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    modelCount: s.models.length
  }));
});

/* GET single simulation */
router.get("/api/simulations/:id", async (ctx) => {
  const sim = await DB.getSimulation(ctx.params.id);
  if (!sim) { ctx.response.status = 404; return; }
  ctx.response.body = sim;
});

/* POST create new simulation */
router.post("/api/simulations", async (ctx) => {
  const body = await ctx.request.body().value;
  const { title, models } = body;

  const newSim = {
    id: crypto.randomUUID(),
    title: title.substring(0, 200).trim(),
    models: models.map((m: any) => ({
      ...m,
      ...MODELS.find(cfg => cfg.id === m.modelId)
    })),
    messages: [{
      id: crypto.randomUUID(),
      role: "system",
      content: title, // Base context
      timestamp: Date.now()
    }],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await DB.saveSimulation(newSim);
  ctx.response.status = 201;
  ctx.response.body = newSim;
});

/* PATCH rename simulation */
router.patch("/api/simulations/:id", async (ctx) => {
  const sim = await DB.getSimulation(ctx.params.id);
  if (!sim) { ctx.response.status = 404; return; }
  
  const { title } = await ctx.request.body().value;
  sim.title = title.substring(0, 200).trim();
  await DB.saveSimulation(sim);
  ctx.response.body = sim;
});

/* DELETE simulation */
router.delete("/api/simulations/:id", async (ctx) => {
  await DB.deleteSimulation(ctx.params.id);
  ctx.response.status = 204;
});

/* GET export simulation */
router.get("/api/simulations/:id/export", async (ctx) => {
  const sim = await DB.getSimulation(ctx.params.id);
  if (!sim) { ctx.response.status = 404; return; }
  
  ctx.response.headers.set("Content-Type", "application/json");
  ctx.response.headers.set("Content-Disposition", `attachment; filename="${sim.id}.json"`);
  ctx.response.body = JSON.stringify(sim, null, 2);
});

export default router;