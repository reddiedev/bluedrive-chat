
export type SessionData = {
  id: string,
  title: string,
  username: string
}

export type MessageData = {
  id: string,
  role: "user" | "assistant",
  content: string,
  name: string,
  created_at: string
}

export type ChatResponse = {
  message: string;
  session: SessionData;
  messages: MessageData[];
}