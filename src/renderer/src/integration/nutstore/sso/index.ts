import { createOAuthUrl, decrypt } from './lib'

export interface OAuthResponse {
  username: string
  userid: string
  access_token: string
}

export async function nutstoreSsoLogin() {
  const url = createOAuthUrl({
    app: 'cherrystudio'
  })

  window.open(url)
}

export async function decryptToken(token: string) {
  try {
    const decrypted = decrypt(token)
    return JSON.parse(decrypted) as OAuthResponse
  } catch (error) {
    console.error('解密失败:', error)
    return null
  }
}
