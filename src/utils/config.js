import fs from "fs/promises"
import "dotenv/config"
import { get, post } from "./request.js"
import qs from "qs"

let twitchConfig = null
const filePath = process.env.SECRETS_PATH

export const getTwitchConfig = async () => {
  if(twitchConfig) return twitchConfig

  const file = await fs.readFile(filePath, 'utf8')
  const data = JSON.parse(file)
  const { accessToken, refreshToken, clientId, clientSecret } = data
  twitchConfig = { accessToken, refreshToken, clientId, clientSecret }
  
  return twitchConfig
}

export const updateTwitchConfig = (newToken) => {
  twitchConfig.accessToken = newToken
  fs.writeFile(filePath, JSON.stringify(twitchConfig))

  return twitchConfig
}

export const isTokenExpired = async () => {
  const config = await getTwitchConfig()
  const headers = { Authorization: `Bearer ${config.accessToken}` }
  try {
    await get("https://id.twitch.tv/oauth2/validate", { headers })
    return false
  } catch (error) {
    return true
  }
}

export const refreshExpiredToken = async () => {
  const config = await getTwitchConfig()
  const data = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
    refresh_token: config.refreshToken,
  }
  const newTokenData = (await post("https://id.twitch.tv/oauth2/token", qs.stringify(data))).data
  
  return updateTwitchConfig(newTokenData.access_token)
}