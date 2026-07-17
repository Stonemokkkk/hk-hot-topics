// app/api/scrape/route.ts

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { setJob } from '@/lib/kv';
import type { ScrapeJob, ScrapeSource } from '@/lib/types';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  const { sources } = await request.json() as { sources?: ScrapeSource[] };

  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Sources array required' },
      { status: 400 }
    );
  }

  const jobId = randomUUID();
  const job: ScrapeJob = {
    jobId,
    status: 'running',
    progress: 0,
    sources,
    startedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
  };

  // Save initial job state
  await setJob(job);

  // Run scraper in background (Vercel Background Function pattern)
  const scraperPath = path.join(process.cwd(), 'scraper', 'scraper.py');
  const sourceArgs = sources.join(' ');

  exec(`python3 ${scraperPath} --json ${sourceArgs}`, {
    timeout: 4 * 60 * 1000, // 4 minutes (leave buffer for 5 min limit)
    maxBuffer: 10 * 1024 * 1024, // 10MB buffer
  }, async (error, stdout, stderr) => {
    if (error) {
      job.status = 'error';
      job.error = error.message;
      job.completedAt = new Date().toISOString();
      await setJob(job);
      return;
    }

    try {
      const result = JSON.parse(stdout);
      job.status = 'complete';
      job.progress = 100;
      job.completedAt = new Date().toISOString();
      await setJob(job);

      // Store results separately
      const { setResults } = await import('@/lib/kv');
      await setResults(jobId, {
        date: result.date,
        topics: result.trends,
      });
    } catch (e) {
      job.status = 'error';
      job.error = 'Failed to parse scraper output';
      job.completedAt = new Date().toISOString();
      await setJob(job);
    }
  });

  return NextResponse.json({ success: true, data: { jobId } });
}
