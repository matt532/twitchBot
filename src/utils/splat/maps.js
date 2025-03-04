import { get } from "../request.js";

export default async function getMaps(mode) {
  const mapData = (await get('https://splatoon3.ink/data/schedules.json')).data
  let maps

  switch(mode) {
    case "turf":
      maps = getTurfMaps(mapData)
      break
    case "series":
      maps = getSeriesMaps(mapData)
      break
    case "open":
      maps = getOpenMaps(mapData)
      break
    case "x":
      maps = getXRankMaps(mapData)
      break
    case "salmon":
      maps = getSalmonMaps(mapData)
      break
  }
  return maps
}

function getTurfMaps(mapData) {
  return mapData.data.regularSchedules.nodes.map(node => {
    return {
      maps: node?.regularMatchSetting?.vsStages?.map(stage => stage.name),
      endTime: node.endTime
    }
  })
}

function getXRankMaps(mapData) {
  return mapData.data.xSchedules.nodes.map(node => {
    return {
      maps: node?.xMatchSetting?.vsStages?.map(stage => stage.name),
      endTime: node.endTime,
      gameMode: node.xMatchSetting.vsRule.name
    }
  })
}

function getAnarchyMaps(mapData) {
  const anarchyMaps = mapData.data.bankaraSchedules.nodes.map((node) => {
    return node?.bankaraMatchSettings?.map(matchSettings => {
      return {
        endTime: node.endTime,
        maps: matchSettings.vsStages.map(stage => stage.name),
        gameMode: matchSettings.vsRule.name,
        anarchyMode: matchSettings.bankaraMode
      }
    })
  });
  const anarchyMapsFlat = [].concat(...anarchyMaps)
  
  return anarchyMapsFlat
}

function getSeriesMaps(mapData){
  return getAnarchyMaps(mapData)?.filter(mapSet => mapSet.anarchyMode === 'CHALLENGE')
}

function getOpenMaps(mapData){
  return getAnarchyMaps(mapData)?.filter(mapSet => mapSet.anarchyMode === 'OPEN')
}

function getSalmonMaps(mapData) {
  return mapData.data.coopGroupingSchedule.regularSchedules.nodes.map(node => {
    return {
      map: node.setting.coopStage?.name,
      endTime: node.endTime,
      weapons: node.setting.weapons.map(weapon => weapon.name),
      boss: node.setting.boss.name
    }
  })
}