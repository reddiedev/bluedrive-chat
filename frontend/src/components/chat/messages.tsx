import { User } from "lucide-react"
import { BardMark } from "~/components/bard-mark"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { MessageData } from "~/lib/api.types"
import { cn } from "~/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"

export function MessageBox({ message }: { message: MessageData }) {
  const isUser = message.role === "user"

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
        {message.content !== "" ? (
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
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <span className="typing-dots" role="status" aria-label="Assistant is replying">
            <span />
            <span />
            <span />
          </span>
        )}
        {message.content !== "" && time}
      </div>
    </div>
  )
}
