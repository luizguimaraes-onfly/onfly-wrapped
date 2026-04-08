import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

function getMasterKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY
  if (!hex)              throw new Error('TOKEN_ENCRYPTION_KEY is not set')
  if (hex.length !== 64) throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex chars)')
  return Buffer.from(hex, 'hex')
}

/** Encrypts with AES-256-GCM. Returns "{iv}:{authTag}:{ciphertext}" in hex. */
export function encryptToken(plaintext: string): string {
  const key    = getMasterKey()
  const iv     = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag   = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

/** Decrypts a value produced by encryptToken. Throws if integrity check fails. */
export function decryptToken(stored: string): string {
  const key   = getMasterKey()
  const parts = stored.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted token format')
  const [ivHex, authTagHex, ciphertextHex] = parts
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  return (
    decipher.update(Buffer.from(ciphertextHex, 'hex')).toString('utf8') +
    decipher.final('utf8')
  )
}