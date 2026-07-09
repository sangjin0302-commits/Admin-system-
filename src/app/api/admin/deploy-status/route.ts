import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID ?? "prj_TdKYyeXInz4lwUEi1gcycCYYBWi1";
  const teamId = process.env.VERCEL_TEAM_ID ?? "team_KQyZosmlEvdSwYQMFJiTWLyd";

  if (!token) {
    return NextResponse.json({ deployments: [], error: "VERCEL_TOKEN not configured" });
  }

  try {
    const url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5&teamId=${teamId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return NextResponse.json({ deployments: [], error: `vercel_api_${res.status}` });
    }

    const data = await res.json();
    const deployments = (data.deployments ?? []).map((d: Record<string, unknown>) => ({
      id: d.uid,
      state: d.state,
      createdAt: d.createdAt,
      url: d.url,
      meta: {
        githubCommitMessage: (d.meta as Record<string, unknown>)?.githubCommitMessage ?? null,
      },
    }));

    return NextResponse.json({ deployments });
  } catch {
    return NextResponse.json({ deployments: [], error: "fetch_failed" });
  }
}
