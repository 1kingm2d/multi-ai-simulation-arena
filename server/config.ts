/**
 * FILE: server/config.ts
 * PURPOSE: Central configuration for AI models and system constants.
 * DEPENDENCIES: None
 */

export const CONFIG = {
  PORT: parseInt(Deno.env.get("PORT") || "8000"),
  MAX_API_KEYS: 15,
  MAX_CONTEXT_TOKENS: 8000,
  SUMMARY_THRESHOLD: 8000,
  SUMMARY_MODEL: "meta-llama/llama-3.1-8b-instruct",
  
  MODELS: [
    { id: "grok", name: "Grok", endpoint: "x-ai/grok-2-1212", avatar: "🤖", color: "#00f0ff" },
    { id: "gpt4o", name: "GPT-4o", endpoint: "openai/gpt-4o", avatar: "🧠", color: "#b400ff" },
    { id: "claude", name: "Claude 3.5", endpoint: "anthropic/claude-3.5-sonnet", avatar: "🎭", color: "#ff006e" },
    { id: "gemini", name: "Gemini 1.5", endpoint: "google/gemini-pro-1.5", avatar: "💎", color: "#0066ff" },
    { id: "deepseek", name: "DeepSeek V3", endpoint: "deepseek/deepseek-chat", avatar: "🌊", color: "#00ff9d" },
    { id: "qwen", name: "Qwen 2.5", endpoint: "qwen/qwen-2.5-72b-instruct", avatar: "🐉", color: "#ff8800" }
  ]
};

/**
 * Generates a system prompt based on simulation title and role.
 */
export const getSystemPrompt = (title: string, role: string) => 
  `You are the ${role} in a simulation titled "${title}". Stay in character. Investigate, interact, and respond as this persona would. Do not break the fourth wall.`[cite: 115, 202];