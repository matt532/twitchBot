import "dotenv/config";
import tmi from "tmi.js";
import { weapons } from "./weapons.js";
import { getUser, getChannelInfo } from "./endpoints.js";

const option = {
  options: {
    debug: true,
  },
  connection: {
    cluster: "aws",
    reconnect: true,
  },
  identity: {
    username: process.env.CHANNEL,
    password: process.env.OAUTH,
  },
  channels: [process.env.CHANNEL],
};

const client = new tmi.client(option);
client.connect();

client.on("connectFailed", function (error) {
  console.log("Connect Error: " + error.toString());
});

client.on("connected", () => {
  client.say(process.env.CHANNEL, "Bot has connected");
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
      `@${username} finished their milkshake and decided to head out, thanks for stopping by! crowsp2Lurk`
    );
    return;
  }

  if (command === "!unlurk") {
    client.say(
      channel,
      `@${username} decided to come back for more milkshakes`
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
  let userInfo = await getUser(username);
  // if user with given username doesn't exist, return
  if (userInfo.data.length === 0) {
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
    "Go check out " +
      shoutout.user +
      " at twitch.tv/" +
      shoutout.user +
      " where they last played " +
      shoutout.game +
      "!"
  );
}
