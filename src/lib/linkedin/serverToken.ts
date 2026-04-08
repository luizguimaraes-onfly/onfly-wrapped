import { NextRequest } from 'next/server'
import { decryptToken } from './crypto'
import { LINKEDIN_CONFIG } from './config'
import type { LinkedInAccount } from './types'

export function getAccountFromRequest(req: NextRequest): LinkedInAccount | null {
  const raw = req.cookies.get('li_account')?.value
  if (!raw) return null
  try { return JSON.parse(raw) as LinkedInAccount } catch { return null }
}

export function getValidTokenFromRequest(req: NextRequest): string | null {
  const account = getAccountFromRequest(req)
  if (!account) return null
  if (account.status === 'REVOKED' || account.status === 'DISCONNECTED') return null
  if (account.accessTokenExpiresAt <= Date.now() + LINKEDIN_CONFIG.EXPIRY_BUFFER_MS) return null
  try { return decryptToken(account.accessTokenEncrypted) } catch { return null }
}

/** Returns "urn:li:person:{sub}" — always with full prefix */
export function getAuthorUrn(req: NextRequest): string | null {
  const account = getAccountFromRequest(req)
  if (!account?.linkedinUrn) return null
  const urn = account.linkedinUrn
  return urn.startsWith('urn:li:person:') ? urn : `urn:li:person:${urn}`
}