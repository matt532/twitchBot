import "dotenv/config";
import tmi from "tmi.js";
import dayjs from "dayjs";
import weapons from "./weapons.js";
import * as modules from "./modules.js";

const channel = process.env.CHANNEL
const token = process.env.OAUTH_TOKEN

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
    password: `oauth:${token}`,
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

  if (command.toLowerCase() === "cat") {
    // TODO: add cooldown so this command doesn't get too spammy
    client.say(channel, "Yeet da kitty");
    return;
  }

  if (command === "!turf") {
    modules.getTurfMaps().then(turf => {
      const msg = mapRotationMsg(username, 'Turf War', turf[0].maps, turf[0].endTime)
      client.say(channel, msg)
      console.log(turf)
    })
    return
  }

  if (command === "!series") {
    modules.getSeriesMaps().then(series => {
      const msg = mapRotationMsg(username, series[0].gameMode, series[0].maps, series[0].endTime, 'Series ')
      client.say(channel, msg)
    })
    return
  }
  
  if (command === "!open") {
    modules.getOpenMaps().then(open => {
      const msg = mapRotationMsg(username, open[0].gameMode, open[0].maps, open[0].endTime, 'Open ')
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

  if (command === "!fc") {
    client.say(channel, "SW-3605-7316-8603");
    return;
  }

  // shoutout command, check if mod or broadcaster used command
  if (isModUp && command === "!so") {
    shoutoutStreamer(channel, message);
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

async function shoutoutStreamer(channel, message) {
  // didn't specify a user to get
  if (message.length < 10) return;
  // get username
  let username = message.split(" ")[1];
  // remove '@' character if user was specified through @ mention
  if (username[0] === "@") username = username.substring(1);
  // get user information from helix/users endpoint
  let userInfo = await modules.getUser(username);
  // if user with given username doesn't exist, return
  console.log(userInfo)
  if (userInfo?.data?.length === 0) {
    client.say(channel, "Error: channel not found");
    return;
  }
  // userID for the given user
  let userID = userInfo.data[0].id;
  // get channel info from helix/channels endpoint
  let channelInfo = await modules.getChannelInfo(userID);
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

function mapRotationMsg(user, mode, maps, time, battleType='') {
  let timeLeft = dayjs(time).diff(dayjs(), 'minutes')
  let msg = `@${user} current ${battleType}maps: ${mode} on ${maps[0]} and ${maps[1]}, ends in ${timeLeft}m`
  return msg
}