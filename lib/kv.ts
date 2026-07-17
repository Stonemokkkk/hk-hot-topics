// lib/kv.ts — In-memory store (replaces @vercel/kv which is no longer available)
import type { ScrapeJob, ScrapeResult, GeneratedTool } from './types';

const jobs = new Map<string, ScrapeJob>();
const results = new Map<string, ScrapeResult>();
const tools = new Map<string, GeneratedTool>();
const toolsIndex: string[] = [];

// Job operations
export async function getJob(jobId: string): Promise<ScrapeJob | null> {
  return jobs.get(jobId) ?? null;
}

export async function setJob(job: ScrapeJob): Promise<void> {
  jobs.set(job.jobId, job);
}

// Result operations
export async function getResults(jobId: string): Promise<ScrapeResult | null> {
  return results.get(jobId) ?? null;
}

export async function setResults(jobId: string, res: ScrapeResult): Promise<void> {
  results.set(jobId, res);
}

// Tool operations
export async function setTool(tool: GeneratedTool): Promise<void> {
  tools.set(tool.toolId, tool);
  toolsIndex.unshift(tool.toolId);
  if (toolsIndex.length > 100) toolsIndex.pop();
}

export async function listTools(): Promise<GeneratedTool[]> {
  return toolsIndex.slice(0, 20).map(id => tools.get(id)!).filter(Boolean);
}
