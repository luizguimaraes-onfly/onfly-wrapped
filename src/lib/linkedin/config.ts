export const LINKEDIN_CONFIG = {
  AUTH_URL:    'https://www.linkedin.com/oauth/v2/authorization',
  TOKEN_URL:   'https://www.linkedin.com/oauth/v2/accessToken',
  REVOKE_URL:  'https://www.linkedin.com/oauth/v2/revoke',
  USERINFO_URL: 'https://api.linkedin.com/v2/userinfo',
  IMAGES_URL:  'https://api.linkedin.com/rest/images',
  SCOPES:      'openid profile email w_member_social',
  API_VERSION: '202503',
  ACCESS_TOKEN_TTL_SECONDS: 5_184_000, // 60 days
  STATE_COOKIE_MAX_AGE:     600,       // 10 min
  ACCOUNT_COOKIE_MAX_AGE:   5_184_000, // 60 days
  EXPIRY_BUFFER_MS:         5 * 60 * 1000,
}

export function getLinkedInCredentials() {
  const clientId     = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const redirectUri  = process.env.LINKEDIN_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'LinkedIn not configured. Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI.'
    )
  }

  return { clientId, clientSecret, redirectUri }
}