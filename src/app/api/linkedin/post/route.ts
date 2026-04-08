import { NextRequest, NextResponse } from 'next/server'
import { LINKEDIN_CONFIG } from '@/lib/linkedin/config'
import { getValidTokenFromRequest, getAuthorUrn } from '@/lib/linkedin/serverToken'

export async function POST(req: NextRequest) {
  const token     = getValidTokenFromRequest(req)
  const authorUrn = getAuthorUrn(req)

  if (!token || !authorUrn) {
    return NextResponse.json({ error: 'LINKEDIN_NOT_CONNECTED', requiresReauth: true }, { status: 401 })
  }

  const body = await req.json() as { text: string; imageUrn?: string }
  const { text, imageUrn } = body
  if (!text?.trim()) {
    return NextResponse.json({ error: 'MISSING_TEXT' }, { status: 400 })
  }

  const distribution = {
    feedDistribution:               'MAIN_FEED',
    targetEntities:                 [],
    thirdPartyDistributionChannels: [],
  }

  const payload: Record<string, unknown> = {
    author:      authorUrn,
    commentary:  text.slice(0, 3000),
    visibility:  'PUBLIC',
    distribution,
    lifecycleState:           'PUBLISHED',
    isReshareDisabledByAuthor: false,
  }

  if (imageUrn) {
    payload.content = { media: { id: imageUrn } }
  }

  const postRes = await fetch('https://api.linkedin.com/rest/posts', {
    method:  'POST',
    headers: {
      Authorization:               `Bearer ${token}`,
      'Content-Type':              'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'Linkedin-Version':          LINKEDIN_CONFIG.API_VERSION,
    },
    body: JSON.stringify(payload),
  })

  if (postRes.status === 401) {
    return NextResponse.json({ error: 'TOKEN_EXPIRED', requiresReauth: true }, { status: 401 })
  }
  if (postRes.status === 403) {
    return NextResponse.json({ error: 'PERMISSION_DENIED', requiresConnect: true }, { status: 403 })
  }
  if (postRes.status === 422) {
    return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 422 })
  }
  if (!postRes.ok) {
    return NextResponse.json({ error: 'POST_FAILED' }, { status: 502 })
  }

  // The post URN lives in the response header, not the body
  const postUrn = postRes.headers.get('x-restli-id') ?? ''
  const encodedUrn = encodeURIComponent(postUrn)
  const postUrl = postUrn ? `https://www.linkedin.com/feed/update/${encodedUrn}/` : null

  return NextResponse.json({ postUrn, postUrl }, { status: 201 })
}