import { auth } from "@/auth";
import type { AppSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// Allow AI generation calls time to complete
export const maxDuration = 60;

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:5000";

async function proxyRequest(req: NextRequest, params: { path: string[] }) {
  const session = (await auth()) as AppSession | null;
  const upstreamPath = params.path.join("/");
  const search = req.nextUrl.search;
  const url = `${BACKEND}/api/${upstreamPath}${search}`;

  const headers = new Headers();
  headers.set("Content-Type", req.headers.get("Content-Type") ?? "application/json");
  if (session?.appToken) {
    headers.set("Authorization", `Bearer ${session.appToken}`);
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
  });

  const responseBody = await upstream.arrayBuffer();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, await params);
}
