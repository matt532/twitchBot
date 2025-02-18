import "dotenv/config";
import fetch from "node-fetch";
import { get } from "./utils/request";
// import fs from 'fs'

const token = process.env.OAUTH_TOKEN;
const clientID = process.env.CLIENT_ID;
const BASE_TWITCH_URL = 'https://api.twitch.tv/helix'

// TODO: add function to get new access token if current token is expired

export async function getUser(username) {
  console.log(username)
  const url = `${BASE_TWITCH_URL}/users?login=${username}`
  const headers = {
    Authorization: `Bearer ${token}`,
    "Client-Id": clientID,
  }
  const res = await get(url, headers)
  // const res = await fetch(url, {
  // });
  if (res.status === 401) {
    console.log('Error 401 unauthorized, check access token expiration')
  }
  if (res.status !== 200) {
    console.log("An error occured, status " + res.status);
    return;
  }
  // const obj = await res.json();
  return res.data;
}

export async function getChannelInfo(userID) {
  const url = `${BASE_TWITCH_URL}/channels?broadcaster_id=${userID}`
  const res = await fetch(url, {
    headers: {
      Authorization: "Bearer " + token,
      "Client-Id": clientID,
    },
  });
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
  const obj = await res.json();
  return obj;
}

async function getMaps() {
  const url = 'https://splatoon3.ink/data/schedules.json'
  const maps = await fetch(url).then(res => {
    return res.json()
  }).then(jsonRes => {
    return jsonRes
  }).catch(err => {
    console.log(err)
  })
  // console.log(maps)
  // fs.writeFile('./maps.json', JSON.stringify(maps), err => {
  //   if (err) {
  //     console.log(err)
  //   }
  // })
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