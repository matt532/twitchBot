import "dotenv/config";
import tmi from "tmi.js";
import dayjs from "dayjs";
import weapons from "./weapons.js";
import maps from "./utils/splat/maps.js";
import { getTwitchConfig, isTokenExpired, refreshExpiredToken } from "./utils/twitch/config.js";
import { getUser, getChannelInfo } from "./utils/twitch/twitchAPI.js";

const channel = process.env.CHANNEL
let config = await getTwitchConfig()
if(await isTokenExpired(config.accessToken))
  config.accessToken = await refreshExpiredToken()

const start = () => {
  const option = {
    options: {
      debug: true,
    },
    connection: {
      cluster: "aws",
      reconnect: true,
    },
    identity: {
      username: channel,
      password: `oauth:${config.accessToken}`,
    },
    channels: [channel],
  };
  
  const client = new tmi.client(option);
  client.connect().then(() => {
    client.say(channel, "Bot has connected");
  }).catch(error => {
    console.log("Connect Error: " + error.toString());
  });
  
  client.on('message', (channel, tags, message, self) => {
    console.log(`${tags['display-name']}: ${message}`);
  });
  
  // when a message is sent in chat
  client.on("chat", (channel, userstate, message, self) => {
    if (self) return;
  
    const username = userstate.username;
    const badges = userstate.badges || {};
    const isBroadcaster = badges.broadcaster;
    const isMod = badges.moderator;
    const isVIP = badges.vip;
    const isModUp = isMod || isBroadcaster;
    const command = message.split(" ")[0];

    if(message.includes("bunny")) {
      client.say(channel, "Buy your sea bunny plush here: https://mahoukarp.com/collections/plushies/products/instock-sea-bunny")
    }
  
    if (command.toLowerCase() === "cat") {
      // TODO: add cooldown so this command doesn't get too spammy
      client.say(channel, "Yeet da kitty");
      return;
    }
  
    if (command === "!turf") {
      maps("turf").then(turf => {
        const msg = mapRotationMsg(username, 'Turf war', turf[0].maps, turf[0].endTime)
        client.say(channel, msg)
      })
      return
    }
  
    if (command === "!series") {
      maps("series").then(series => {
        const msg = mapRotationMsg(username, series[0].gameMode, series[0].maps, series[0].endTime, 'Series ')
        client.say(channel, msg)
      })
      return
    }
    
    if (command === "!open") {
      maps("open").then(open => {
        const msg = mapRotationMsg(username, open[0].gameMode, open[0].maps, open[0].endTime, 'open ')
        client.say(channel, msg)
      })
      return
    }

    if (command === "!salmon") {
      maps("salmon").then(sr => {
        const currRot = sr[0]
        const weaponsStr = currRot.weapons.join(", ")
        const timeLeft = dayjs(currRot.endTime).diff(dayjs(), 'minutes')
        client.say(channel, `Current Salmon Run map: ${currRot.map} with ${weaponsStr}. King Salmonid: ${currRot.boss}. Ends in ends in ${timeLeft}m`)
      })
    }

    if (command === "!x") {
      maps("x").then(x => {
        const msg = mapRotationMsg(username, x[0].gameMode, x[0].maps, x[0].endTime, 'X rank ')
        client.say(channel, msg)
      })
      return
    }
  
    if (command === "^") {
      client.say(channel, "^^");
      return;
    }
  
    if (command === "!hello") {
      client.say(channel, `@${username}, hello!`);
      return;
    }
  
    if (command === "!rw") {
      client.say(
        channel,
        `@${username} ${weapons[Math.floor(Math.random() * weapons.length + 1)]}`
      );
      return;
    }
  
    if (command === "!lurk") {
      client.say(
        channel,
        `@${username} took to the skies crowsp2Lurk`
      );
      return;
    }
  
    if (command === "!unlurk") {
      client.say(
        channel,
        `@${username} flew back to the birb nest crowsp2Birb`
      );
      return;
    }
  
    // shoutout command, check if mod or broadcaster used command
    if (isModUp && command === "!so") {
      shoutoutStreamer(client, channel, message);
      return;
    }
  
    if (isBroadcaster && command === "!SIGINT") {
      client.say(channel, "disconnecting");
      client.disconnect();
    }
  });
  
  client.on("subscription", (channel, username, method, message, userstate) => {
    client.say(
      channel,
      `Thank you @${username} so much for the sub! It is much appreciated :) enjoy the emotes!`
    );
  });
  
  client.on("resub", (channel, username, months, message, userstate, methods) => {
    // Do your stuff.
    let cumulativeMonths = ~~userstate["msg-param-cumulative-months"];
  });
  
  client.on("cheer", (channel, userstate, message) => {
    client.say(
      channel,
      `Thank you @${username} for the ${userstate.bits} bit! It is much appreciated :)`
    );
  });
  
  client.on("raided", (channel, username, viewers) => {
    // Do your stuff.
  });
  
  function mapRotationMsg(user, mode, maps, time, battleType='') {
    let timeLeft = dayjs(time).diff(dayjs(), 'minutes')
    let msg = `@${user} current ${battleType}maps: ${mode} on ${maps[0]} and ${maps[1]}, ends in ${timeLeft}m`
    return msg
  }
}

async function shoutoutStreamer(client, channel, message) {
  // didn't specify a user to get
  if (message.length < 10) return;
  // get username
  let username = message.split(" ")[1];
  // remove '@' character if user was specified through @ mention
  if (username[0] === "@") username = username.substring(1);
  // get user information from helix/users endpoint
  let userInfo = await getUser(username);
  // if user with given username doesn't exist, return
  if (userInfo?.data?.length === 0) {
    client.say(channel, "Error: channel not found");
    return;
  }
  // userID for the given user
  let userID = userInfo.data[0].id;
  // get channel info from helix/channels endpoint
  let channelInfo = await getChannelInfo(userID);
  // channel info to use for the shoutout
  let shoutout = { user: username, game: channelInfo.data[0].game_name };
  if (shoutout.game.length === 0) {
    shoutout.game = "no game";
  }
  client.say(
    channel,
    `Go check out ${shoutout.user} at twitch.tv/${shoutout.user} where they last played ${shoutout.game}!`
  );
}

start()