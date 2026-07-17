// app/api/status/route.ts

import { NextResponse } from 'next/server';
import { getJob, getResults } from '@/lib/kv';
import type { ScrapeJob, Topic } from '@/lib/types';

interface StatusResponse {
  job: ScrapeJob;
  topics?: Topic[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: 'jobId query parameter required' },
      { status: 400 }
    );
  }

  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { success: false, error: 'Job not found' },
      { status: 404 }
    );
  }

  let topics: Topic[] | undefined;
  if (job.status === 'complete') {
    const results = await getResults(jobId);
    topics = results?.topics;
  }

  return NextResponse.json({
    success: true,
    data: { job, topics }
  });
}
