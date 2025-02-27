import axios from "axios";

export async function get(url, headers={}) {
  return await axios.get(url, headers)
}

export async function post(url, data) {
  return await axios.post(url, data)
}