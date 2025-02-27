import "dotenv/config";
import qs from "qs"
import { get, post } from "./utils/request.js";

const token = process.env.ACCESS_TOKEN;
const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const refreshToken = process.env.REFRESH_TOKEN
const BASE_TWITCH_URL = 'https://api.twitch.tv/helix'

export const isTokenExpired = async () => {
  const headers = { Authorization: `Bearer ${token}` }
  try {
    await get("https://id.twitch.tv/oauth2/validate", { headers })
    return false
  } catch (error) {
    return true
  }
}

export const refreshExpiredToken = async () => {
  const data = {
    client_id: clientID,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  }
  const newToken = (await post("https://id.twitch.tv/oauth2/token", qs.stringify(data))).data
  return newToken
}

export async function getUser(username) {
  const url = `${BASE_TWITCH_URL}/users?login=${username}`
  const headers = {
    Authorization: `Bearer ${token}`,
    "Client-Id": clientID,
  }
  try {
    const res = await get(url, { headers });
    return res.data
  } catch (error) {
    if (error.status === 401) {
      console.log('Error 401 unauthorized, check access token expiration')
      refreshExpiredToken()
      return
    }
    if (error.status !== 200) {
      console.log("An error occured, status " + res.status);
      return;
    }
    console.error("error")
  }
}

export async function getChannelInfo(userID) {
  const url = `${BASE_TWITCH_URL}/channels?broadcaster_id=${userID}`
  const headers = {
    Authorization: "Bearer " + token,
    "Client-Id": clientID,
  }
  const res = await get(url, { headers });
  if (res.status === 400) {
    console.log("Missing query parameter");
    return;
  }
  if (res.status === 500) {
    console.log("Internal server error, failed to get channel info");
    return;
  }
  if (res.status !== 200) {
    console.log("Unknown error, status code " + res.status);
    return;
  }

  return res.data;
}

async function getMaps() {
  const maps = (await get('https://splatoon3.ink/data/schedules.json')).data
  return maps?.data
}

export async function getTurfMaps() {
  const turfMaps = (await getMaps())?.regularSchedules.nodes.map(node => {
    return {
      maps: node?.regularMatchSetting?.vsStages?.map(stage => stage.name),
      endTime: node.endTime
    }
  })
  console.log(turfMaps)
  return turfMaps
}

async function getAnarchyMaps() {
  const seriesMaps = (await getMaps())?.bankaraSchedules.nodes.map((node) => {
    return node?.bankaraMatchSettings?.map(matchSettings => {
      return {
        endTime: node.endTime,
        maps: matchSettings.vsStages.map(stage => stage.name),
        gameMode: matchSettings.vsRule.name,
        anarchyMode: matchSettings.bankaraMode
      }
    })
  });
  const seriesMapsFlat = [].concat(...seriesMaps)
  console.log(seriesMapsFlat)
  return seriesMapsFlat
}

export async function getSeriesMaps(){
  return (await getAnarchyMaps())?.filter(mapSet => mapSet.anarchyMode === 'CHALLENGE')
}

export async function getOpenMaps(){
  return (await getAnarchyMaps())?.filter(mapSet => mapSet.anarchyMode === 'OPEN')
}