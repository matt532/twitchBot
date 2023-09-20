import "dotenv/config";
import fetch from "node-fetch";

const accessToken = process.env.ACCESS_TOKEN;
const clientID = process.env.API_CLIENT_ID;
const BASE_URL = 'https://api.twitch.tv/helix'

// TODO: add function to get new access token if current token is expired

export async function getUser(username) {
  const url = `${BASE_URL}/users?login=${username}`
  const res = await fetch(url, {
    headers: {
      Authorization: "Bearer " + accessToken,
      "Client-Id": clientID,
    },
  });
  if (res.status !== 200) {
    console.log("And error occured, status " + res.status);
    return;
  }
  const obj = await res.json();
  return obj;
}

export async function getChannelInfo(userID) {
  const url = `${BASE_URL}/channels?broadcaster_id=${userID}`
  const res = await fetch(url, {
    headers: {
      Authorization: "Bearer " + accessToken,
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
