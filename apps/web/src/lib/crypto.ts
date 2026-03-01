import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

/**
 * Derive a 32-byte key from the ENCRYPTION_KEY env variable using SHA-256.
 */
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY ?? process.env.AUTH_SECRET ?? 'default-dev-key-please-change-me'
  return createHash('sha256').update(secret).digest()
}

export interface EncryptedData {
  ciphertext: string // base64
  iv: string         // base64
  authTag: string    // base64
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 */
export function encrypt(plaintext: string): EncryptedData {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

/**
 * Decrypt an encrypted payload.
 */
export function decrypt(data: EncryptedData): string {
  const key = getKey()
  const iv = Buffer.from(data.iv, 'base64')
  const authTag = Buffer.from(data.authTag, 'base64')
  const ciphertext = Buffer.from(data.ciphertext, 'base64')

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
