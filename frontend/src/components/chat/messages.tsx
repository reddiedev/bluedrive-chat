import { useEffect, useRef, useState } from "react"
import { BrainIcon, ChevronDownIcon, User } from "lucide-react"
import { BardMark } from "~/components/bard-mark"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { MessageData } from "~/lib/api.types"
import { parseThinking } from "~/lib/thinking"
import { cn } from "~/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"

function ThinkingBlock({
  thinking,
  inProgress,
}: {
  thinking: string
  inProgress: boolean
}) {
  const [open, setOpen] = useState(inProgress)
  const wasInProgress = useRef(inProgress)

  // Collapse automatically once the visible answer starts streaming.
  useEffect(() => {
    if (wasInProgress.current && !inProgress) {
      setOpen(false)
    }
    wasInProgress.current = inProgress
  }, [inProgress])

  return (
    <div className="border-border bg-muted/30 my-1 overflow-hidden rounded-[8px] border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="text-muted-foreground hover:text-foreground flex w-full cursor-pointer items-center gap-2 px-3 py-2 font-mono text-[11px] tracking-[0.16em] uppercase transition-colors"
        aria-expanded={open}
      >
        <BrainIcon className="size-3.5 shrink-0" />
        <span>{inProgress ? 'Thinking…' : 'Thought process'}</span>
        <ChevronDownIcon
          className={cn(
            'ml-auto size-3.5 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && thinking !== "" && (
        <div className="text-muted-foreground whitespace-pre-wrap px-3 pb-3 text-[13px] leading-relaxed">
          {thinking}
        </div>
      )}
    </div>
  )
}

export function MessageBox({ message }: { message: MessageData }) {
  const isUser = message.role === "user"

  const { thinking, answer, thinkingInProgress } = parseThinking(message.content)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const name = (
    <span className="text-muted-foreground font-mono text-[11px] tracking-[0.18em] uppercase">
      {isUser ? 'You' : message.name}
    </span>
  )

  const time = (
    <span className="text-muted-foreground font-mono text-[11px]">
      {formatTime(message.created_at)}
    </span>
  )

  if (isUser) {
    return (
      <div className="flex w-full justify-end gap-3 py-5">
        <div className="flex max-w-[42rem] flex-col items-end gap-1.5">
          {name}
          <div className="bg-card border-border rounded-[10px] border px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
          {time}
        </div>
        <Avatar className="size-8 shrink-0">
          <AvatarImage src="https://cdn.reddie.dev/assets/avatar.jpg" alt={message.name} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            <User className="size-4" />
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <div className="flex w-full justify-start gap-3 py-5">
      <div className="flex size-8 shrink-0 items-center justify-center">
        <BardMark className="size-6 text-foreground" />
      </div>
      <div className="border-signal/50 flex min-w-0 max-w-[46rem] flex-col gap-2 border-l-2 pl-4">
        {name}
        {thinking !== null && (
          <ThinkingBlock thinking={thinking} inProgress={thinkingInProgress} />
        )}
        {answer !== "" ? (
          <div className="transcript">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeRaw]}
              components={{
                pre: ({ children, ...props }) => (
                  <pre
                    {...props}
                    className="border-border my-3 overflow-x-auto rounded-[8px] border"
                  >
                    {children}
                  </pre>
                ),
                code: ({ children, className, ...props }: any) => (
                  <code
                    {...props}
                    className={cn(
                      "font-mono",
                      className,
                      !className && "bg-muted rounded px-1 py-0.5 text-[0.9em]",
                    )}
                  >
                    {children}
                  </code>
                ),
              }}
            >
              {answer}
            </ReactMarkdown>
          </div>
        ) : thinking === null ? (
          <span className="typing-dots" role="status" aria-label="Assistant is replying">
            <span />
            <span />
            <span />
          </span>
        ) : null}
        {answer !== "" && time}
      </div>
    </div>
  )
}
