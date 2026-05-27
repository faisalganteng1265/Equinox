import type { NextRequest } from 'next/server';

function normalizeOrigin(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function normalizePrefix(value: string) {
  if (!value) {
    return '';
  }

  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

async function forwardToBackend(request: NextRequest, pathSegments: string[], method: 'GET' | 'POST') {
  const origin = normalizeOrigin(process.env.EQUINOX_API_ORIGIN || 'http://localhost:4000');
  const prefix = normalizePrefix(process.env.EQUINOX_API_PREFIX || '/api');
  const path = pathSegments.join('/');
  const target = new URL(`${origin}${prefix}/${path}`);

  target.search = request.nextUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }

  if (method === 'POST' && process.env.EQUINOX_WRITE_API_KEY) {
    headers.set('x-api-key', process.env.EQUINOX_WRITE_API_KEY);
  }

  const body = method === 'POST' ? await request.text() : undefined;
  const response = await fetch(target, {
    method,
    headers,
    body,
    cache: 'no-store',
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forwardToBackend(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return forwardToBackend(request, path, 'POST');
}
