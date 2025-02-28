import fs from "fs/promises"
import "dotenv/config"

let twitchConfig = null

const filePath = process.env.SECRETS_PATH

export const getTwitchConfig = async () => {
  if(twitchConfig) return twitchConfig

  const file = await fs.readFile(filePath, 'utf8')
  const data = await JSON.parse(file)
  
  const { accessToken, refreshToken, clientId, clientSecret } = data
  twitchConfig = { accessToken, refreshToken, clientId, clientSecret }
  
  return twitchConfig
}
