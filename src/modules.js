import "dotenv/config";
import { get } from "./utils/request.js";

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