import { NextRequest, NextResponse } from 'next/server'
import { LINKEDIN_CONFIG } from '@/lib/linkedin/config'
import { getValidTokenFromRequest, getAuthorUrn } from '@/lib/linkedin/serverToken'

export async function POST(req: NextRequest) {
  const token     = getValidTokenFromRequest(req)
  const authorUrn = getAuthorUrn(req)

  if (!token || !authorUrn) {
    return NextResponse.json({ error: 'LINKEDIN_NOT_CONNECTED' }, { status: 401 })
  }

  const { imageDataUrl } = await req.json() as { imageDataUrl: string }
  if (!imageDataUrl) {
    return NextResponse.json({ error: 'MISSING_IMAGE' }, { status: 400 })
  }

  // Convert data URL to buffer
  const [meta, base64] = imageDataUrl.split(',')
  const mimeMatch = meta.match(/data:([^;]+)/)
  const mimeType  = mimeMatch?.[1] ?? 'image/png'
  const buffer    = Buffer.from(base64, 'base64')

  const headers = {
    Authorization:               `Bearer ${token}`,
    'Content-Type':              'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'Linkedin-Version':          LINKEDIN_CONFIG.API_VERSION,
  }

  // Step 1 — Initialize upload
  const initRes = await fetch(
    `${LINKEDIN_CONFIG.IMAGES_URL ?? 'https://api.linkedin.com/rest/images'}?action=initializeUpload`,
    {
      method:  'POST',
      headers,
      body: JSON.stringify({
        initializeUploadRequest: { owner: authorUrn },
      }),
    }
  )

  if (!initRes.ok) {
    const body = await initRes.text()
    console.error('[linkedin/upload-image] initializeUpload failed', initRes.status, body)
    return NextResponse.json(
      { error: 'UPLOAD_INIT_FAILED', linkedinStatus: initRes.status, linkedinBody: body },
      { status: 502 }
    )
  }

  const { value } = await initRes.json() as {
    value: { uploadUrl: string; image: string; uploadUrlExpiresAt: number }
  }

  // Step 2 — PUT binary to upload URL
  const putRes = await fetch(value.uploadUrl, {
    method:  'PUT',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': mimeType,
    },
    body: buffer,
  })

  if (putRes.status !== 201 && !putRes.ok) {
    console.error('[linkedin/upload-image] PUT failed', putRes.status)
    return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 502 })
  }

  return NextResponse.json({ imageUrn: value.image })
}