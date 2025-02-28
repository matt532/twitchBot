import { get } from "../request.js";
import { getTwitchConfig, isTokenExpired, refreshExpiredToken } from "./config.js";

const BASE_TWITCH_API_URL = 'https://api.twitch.tv/helix'

export async function getUser(username) {
  const config = await getTwitchConfig()
  
  if(await isTokenExpired()) {
    config.accessToken = await refreshExpiredToken()
  }

  const url = `${BASE_TWITCH_API_URL}/users?login=${username}`
  const headers = {
    Authorization: `Bearer ${config.accessToken}`,
    "Client-Id": config.clientId,
  }

  try {
    const res = await get(url, { headers });
    return res.data
  } catch (error) {
    console.error(error)
    return { data: [] }
  }
}

export async function getChannelInfo(userId) {
  const config = await getTwitchConfig()
  
  if(await isTokenExpired()) {
    config.accessToken = await refreshExpiredToken()
  }

  const url = `${BASE_TWITCH_API_URL}/channels?broadcaster_id=${userId}`
  const headers = {
    Authorization: `Bearer ${config.accessToken}`,
    "Client-Id": config.clientId,
  }
  try {
    const res = await get(url, { headers });
    return res.data;
  } catch (error) {
    console.error(error)
    return { username: "", game: [] }
  }
}