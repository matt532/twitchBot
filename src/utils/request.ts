import axios from "axios";

export async function get(url: string, headers?: any) {
  return await axios.get(url, headers)
}