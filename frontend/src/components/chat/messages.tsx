import { Bot, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Card, CardContent } from "~/components/ui/card"
import { MessageData } from "~/lib/api.types"
import { cn } from "~/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"

export function MessageBox({ message }: { message: MessageData }) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  // Format the timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className={cn("flex w-full gap-3 p-4", isUser ? "justify-end" : "justify-start")}>
      {/* Avatar - only show for assistant messages on the left */}
      {isAssistant && (
        <Avatar className="h-8 w-8 shrink-0 items-center justify-center flex">

          <AvatarImage src='/logo.png' className='size-7 ' alt={message.name} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[80%] md:max-w-[70%]",
          isUser && "items-end"
        )}
      >
        {/* Header with name and role */}
        <div
          className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground",
            isUser && "flex-row-reverse"
          )}
        >
          <span className="font-medium">{message.name}</span>
        </div>

        {/* Message bubble */}
        <Card
          className={cn(
            "shadow-sm p-0",
            isUser
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/50"
          )}
        >
          <CardContent className="px-3 py-2">
            <div className="text-sm leading-normal prose prose-sm max-w-none dark:prose-invert [&_p]:my-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  // Custom styling for code blocks
                  pre: ({ children, ...props }) => (
                    <pre
                      {...props}
                      className="bg-gray-100 dark:bg-gray-800 rounded p-2 overflow-x-auto text-xs"
                    >
                      {children}
                    </pre>
                  ),
                  // Custom styling for inline code
                  code: ({ children, ...props }) => (
                    <code {...props} className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">{children}</code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Timestamp */}
        <span
          className={cn(
            "text-xs text-muted-foreground px-1",
            isUser && "text-right"
          )}
        >
          {formatTime(message.created_at)}
        </span>
      </div>

      {/* Avatar - only show for user messages on the right */}
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src='https://cdn.reddie.dev/assets/avatar.jpg' alt={message.name} />
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}