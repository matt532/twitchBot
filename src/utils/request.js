import axios from "axios";

export async function get(url, headers={}) {
  return await axios.get(url, headers)
}