import { createServerFn } from "@tanstack/react-start"
import axios, { AxiosResponse } from "axios"
import { MessageData, ModelData, SessionData } from "~/lib/api.types"

export const getSessions = createServerFn({
  method: 'GET',
  response: 'data',
}).validator((name: string) => {
  return {
    name: name,
  }
}).handler(async ({ data }) => {
  try {
    const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/sessions?name=${data.name}`

    const response: AxiosResponse<SessionData[]> = await axios.get(url)

    const sessions = response.data.slice(0, 15)
    return sessions
  } catch (err) {
    // console.error(err)
    return []
  }
})

export const getSession = createServerFn({
  method: 'GET',
  response: 'data',
}).validator((session_id: string) => {
  return {
    session_id: session_id,
  }
}).handler(async ({ data }) => {
  try {
    const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/session?session_id=${data.session_id}`
    const response: AxiosResponse<{ session: SessionData, messages: MessageData[] }> = await axios.get(url)
    return response.data
  } catch (err) {
    // console.error(err)
    return { session: null, messages: [] }
  }
})

export const getModels = createServerFn({
  method: 'GET',
  response: 'data',
}).handler(async () => {
  try {
    const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/models`
    const response: AxiosResponse<ModelData[]> = await axios.get(url)
    return response.data
  } catch (err) {
    // console.error(err)
    return []
  }
})