import "dotenv/config";
import { get } from "./utils/request.js";
import { getTwitchConfig, } from "./utils/config.js";

const BASE_TWITCH_API_URL = 'https://api.twitch.tv/helix'

export async function getUser(username) {
  const { accessToken, clientId } = await getTwitchConfig()
  const url = `${BASE_TWITCH_API_URL}/users?login=${username}`
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Client-Id": clientId,
  }
  try {
    const res = await get(url, { headers });
    return res.data
  } catch (error) {
    if (error.status === 401) {
      console.error('Error 401 unauthorized, check access token expiration')
      return
    }
    if (error.status !== 200) {
      console.error("An error occured, status " + res.status);
      return;
    }
    console.error("error")
  }
}

export async function getChannelInfo(userID) {
  const { accessToken, clientId } = await getTwitchConfig()
  const url = `${BASE_TWITCH_API_URL}/channels?broadcaster_id=${userID}`
  const headers = {
    Authorization: "Bearer " + accessToken,
    "Client-Id": clientId,
  }
  const res = await get(url, { headers });
  if (res.status === 400) {
    console.error("Missing query parameter");
    return;
  }
  if (res.status === 500) {
    console.error("Internal server error, failed to get channel info");
    return;
  }
  if (res.status !== 200) {
    console.error("Unknown error, status code " + res.status);
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