import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// `crypto.randomUUID` is only available in secure contexts (HTTPS or localhost),
// so fall back to the uuid package when accessed over plain HTTP (e.g. a LAN IP).
export function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return uuidv4()
}

export function isValidUUID(uuid: string) {
  const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return UUID_V4_REGEX.test(uuid)
}


