# Multi-AI Simulation Arena

A production-ready Deno application for orchestrating simultaneous conversations between multiple high-end LLMs.

## 🚀 Features
- **Parallel Inference**: Talk to 6+ AIs at once via OpenRouter.
- **Key Rotation**: Supports up to 15 API keys to bypass rate limits.
- **Smart Memory**: Auto-summarizes long conversations using Deno KV.
- **Voice Mode**: Real-time TTS (Text-to-Speech) and STT (Speech-to-Text).
- **Glassmorphism UI**: High-end cyberpunk aesthetic.

## 🛠️ Setup
1. Clone the repo.
2. Create a `.env` file:
   ```env
   OPENROUTER_API_KEYS='["sk-or-v1-key1", "sk-or-v1-key2"]'
   PORT=8000