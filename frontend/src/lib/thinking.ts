const OPEN_TAG = "<think>"
const CLOSE_TAG = "</think>"

export type ParsedThinking = {
  /** Reasoning text, or null when the message has no think block. */
  thinking: string | null
  /** User-visible answer with the reasoning block removed. */
  answer: string
  /** True while the think block is open and still streaming. */
  thinkingInProgress: boolean
}

/**
 * Splits a message into its think reasoning block and the visible answer.
 *
 * The backend streams raw model output, so during streaming the closing tag may
 * not have arrived yet. A partial opening tag at the very end of the buffer is
 * treated as an in-progress block so a half-written tag is never shown as
 * answer text.
 */
export function parseThinking(content: string): ParsedThinking {
  const start = content.indexOf(OPEN_TAG)

  if (start === -1) {
    const partial = trailingPartialLength(content, OPEN_TAG)
    if (partial > 0) {
      return {
        thinking: "",
        answer: content.slice(0, content.length - partial),
        thinkingInProgress: true,
      }
    }
    return { thinking: null, answer: content, thinkingInProgress: false }
  }

  const before = content.slice(0, start)
  const rest = content.slice(start + OPEN_TAG.length)
  const end = rest.indexOf(CLOSE_TAG)

  if (end === -1) {
    return { thinking: rest, answer: before, thinkingInProgress: true }
  }

  return {
    thinking: rest.slice(0, end),
    answer: before + rest.slice(end + CLOSE_TAG.length),
    thinkingInProgress: false,
  }
}

/** Length of the longest prefix of `tag` that `content` ends with. */
function trailingPartialLength(content: string, tag: string): number {
  const max = Math.min(tag.length - 1, content.length)
  for (let length = max; length > 0; length--) {
    if (content.endsWith(tag.slice(0, length))) return length
  }
  return 0
}
