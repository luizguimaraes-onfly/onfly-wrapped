export type LinkedInStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'DISCONNECTED'

export interface LinkedInAccount {
  linkedinUrn:              string
  displayName:              string | null
  avatarUrl:                string | null
  accessTokenEncrypted:     string
  refreshTokenEncrypted:    string | null
  accessTokenExpiresAt:     number  // ms epoch
  refreshTokenExpiresAt:    number | null
  scopes:                   string
  status:                   LinkedInStatus
}

export interface LinkedInStatusResponse {
  connected:       boolean
  displayName?:    string | null
  avatarUrl?:      string | null
  expiresAt?:      number
  daysUntilExpiry?: number
  status?:         LinkedInStatus
}