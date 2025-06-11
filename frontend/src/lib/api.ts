import { createServerFn } from "@tanstack/react-start"
import axios, { AxiosResponse } from "axios"
import { MessageData, ModelData, SessionData } from "~/lib/api.types"
import fs from "node:fs"

export const getSessions = createServerFn({
  method: 'GET',
  response: 'data',
}).validator(({ name, session_id }: { name: string, session_id: string }) => {
  return {
    name: name,
    session_id: session_id,
  }
}).handler(async ({ data }) => {
  try {
    const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/sessions?name=${data.name}`
  
    const response: AxiosResponse<SessionData[]> = await axios.get(url)

    const sessions = response.data.slice(0, 15)

    // check if session_id is in the sessions, if not, add it at the top of the list with the title "New Thread"
    if (!sessions.some((session) => session.id === data.session_id)) {
      sessions.unshift({
        id: data.session_id,
        title: "🧵 New Thread",
        username: data.name,
        isNew: true,
      })
    }

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


export const streamCompletion = createServerFn({
  method: 'POST',
  response: 'raw',
}).validator(({ name, session_id, content, model }: { name: string, session_id: string, content: string, model: string }) => {
  return {
    name: name,
    session_id: session_id,
    content: content,
    model: model,
  }
}).handler(async ({ data, signal }) => {
  try {

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/stream`, data, {
      responseType: 'stream',
      headers: {
        'Content-Type': 'application/json',
      },
      signal
    });

    const stream = new ReadableStream({
        start(controller) {
          response.data.on('data', (chunk: Buffer) => {
            controller.enqueue(chunk);
          });

          response.data.on('end', () => {
            controller.close();
          });

          response.data.on('error', (error: Error) => {
            controller.error(error);
          });

          // Handle abort signal
          signal?.addEventListener('abort', () => {
            response.data.destroy();
            controller.close();
          });
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Handle abort gracefully
      return new Response('', { status: 499 });
    }
    console.error('Streaming error:', error);
    throw error;
  }
})