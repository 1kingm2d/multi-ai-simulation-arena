/**
 * FILE: types/index.ts
 * PURPOSE: Shared interfaces for the Multi-AI Simulation Arena
 */

export interface VoiceSettings {
  pitch: number;
  rate: number;
  volume: number;
  voiceName: string | null;
}

export interface ModelConfig {
  id: string;
  name: string;
  openRouterModelId: string;
  avatar: string;
  color: string;
  description: string;
}

export interface ModelAssignment extends ModelConfig {
  roleName: string;
}

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  modelId?: string;
  content: string;
  timestamp: number;
}

export interface Simulation {
  id: string;
  title: string;
  models: ModelAssignment[];
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface SimulationListItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  preview: string;
  modelCount: number;
}