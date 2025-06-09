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

export type ModelData = {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}