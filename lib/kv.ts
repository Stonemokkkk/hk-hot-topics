// lib/kv.ts

import { kv } from '@vercel/kv';
import type { ScrapeJob, ScrapeResult, GeneratedTool } from './types';

const JOB_PREFIX = 'scrape:job:';
const RESULT_PREFIX = 'scrape:result:';
const TOOL_PREFIX = 'tool:';
const TOOLS_INDEX = 'tools:index';

// Job operations
export async function getJob(jobId: string): Promise<ScrapeJob | null> {
  return kv.get<ScrapeJob>(`${JOB_PREFIX}${jobId}`);
}

export async function setJob(job: ScrapeJob): Promise<void> {
  await kv.set(`${JOB_PREFIX}${job.jobId}`, job, { ex: 7 * 24 * 60 * 60 }); // 7 days TTL
}

// Result operations
export async function getResults(jobId: string): Promise<ScrapeResult | null> {
  return kv.get<ScrapeResult>(`${RESULT_PREFIX}${jobId}`);
}

export async function setResults(jobId: string, results: ScrapeResult): Promise<void> {
  await kv.set(`${RESULT_PREFIX}${jobId}`, results, { ex: 7 * 24 * 60 * 60 }); // 7 days TTL
}

// Tool operations
export async function getTool(toolId: string): Promise<GeneratedTool | null> {
  return kv.get<GeneratedTool>(`${TOOL_PREFIX}${toolId}`);
}

export async function setTool(tool: GeneratedTool): Promise<void> {
  await kv.set(`${TOOL_PREFIX}${tool.toolId}`, tool, { ex: 30 * 24 * 60 * 60 }); // 30 days TTL

  // Update tools index
  const index = await kv.get<string[]>(TOOLS_INDEX) || [];
  index.unshift(tool.toolId);
  if (index.length > 100) index.pop(); // Keep last 100
  await kv.set(TOOLS_INDEX, index);
}

export async function listTools(): Promise<GeneratedTool[]> {
  const index = await kv.get<string[]>(TOOLS_INDEX) || [];
  const tools: GeneratedTool[] = [];

  for (const toolId of index.slice(0, 20)) { // Latest 20
    const tool = await getTool(toolId);
    if (tool) tools.push(tool);
  }

  return tools;
}
