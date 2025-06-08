import { createFileRoute, Link, useNavigate, } from '@tanstack/react-router'
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import axios, { AxiosResponse } from 'axios'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { Button } from '~/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { ArrowUp, Badge, BookOpenIcon, Bot, Code2Icon, MessageCircleIcon, NewspaperIcon, SearchIcon, SendIcon, StarIcon, StarsIcon, User } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { cn } from '~/lib/utils'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'
import { Card, CardContent } from '~/components/ui/card'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormMessage, FormDescription, FormControl, FormLabel, FormItem, FormField } from '~/components/ui/form'
import { Skeleton } from '~/components/ui/skeleton'

// UUID v4 validation regex
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i



export const Route = createFileRoute('/chat/$session_id')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      username: (search.username as string) || 'User',
    }
  },
  loader: async ({ params }) => {
    const session_id = params.session_id
    const isValid = UUID_V4_REGEX.test(session_id)

    return {
      session_id: session_id,
    }
  },
  component: RouteComponent,
})

type SessionData = {
  id: string,
  title: string,
  username: string
}

type MessageData = {
  id: string,
  role: "user" | "assistant",
  content: string,
  name: string,
  created_at: string
}

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
    console.error(err)
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
    console.error(err)
    return { session: null, messages: [] }
  }
})

function ThreadsSidebar() {
  const { username } = Route.useSearch()
  const { data: sessions } = useQuery({
    queryKey: ['sessions', username],
    queryFn: () => getSessions({ data: encodeURIComponent(username) }),
    initialData: []
  })
  const navigate = useNavigate()



  return (
    <Sidebar className='dark:bg-neutral-950 bg-neutral-950 z-10 '>

      <SidebarHeader className='px-4 pt-4 flex flex-row justify-center items-center font-bold'>
        <img src="/logo.png" alt="Bard" className='size-5' height={512} width={512} />
        <span>Bard</span>
      </SidebarHeader>


      <div className='px-4 pt-2'>
        <Button className='w-full cursor-pointer justify-center' onClick={() => {
          const session_id = crypto.randomUUID()
          navigate({ to: '/chat/$session_id', params: { session_id }, search: { username } })
        }}>
          <MessageCircleIcon />
          New Thread
        </Button>
      </div>

      <SidebarContent className='dark:bg-neutral-950 bg-neutral-950 text-white px-2'>
        <SidebarGroup className='px-0'>
          <div className='flex flex-row items-center gap-1 px-2'>
            <SearchIcon className='size-4' />
            <Input
              placeholder='Search your threads...'
              className='border-none bg-neutral-950 h-auto px-0 py-2 dark:bg-neutral-950 dark:selection:bg-neutral-950 focus-visible:ring-0 '
              spellCheck={false}
              autoComplete='off'
            >
            </Input>
          </div>
          <Separator />
          <SidebarGroupLabel className='text-white'>
            Threads
          </SidebarGroupLabel>
          <SidebarGroupContent className='flex flex-col gap-2'>
            {sessions?.map((session) =>
              <SidebarMenuItem key={session.id}>
                <Link to={`/chat/$session_id`} search={{ username }} params={{ session_id: session.id }}>
                  <SidebarMenuButton asChild>
                    <Button variant='ghost' className='w-full cursor-pointer justify-start'>
                      <span className="truncate">{session.title}</span>
                    </Button>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>)}
            {sessions.length === 0 && (
              <Fragment>
                <SidebarMenuItem className='px-2'>
                  <Skeleton className='w-full h-8' />
                </SidebarMenuItem>  <SidebarMenuItem className='px-2'>
                  <Skeleton className='w-full h-8' />
                </SidebarMenuItem>  <SidebarMenuItem className='px-2'>
                  <Skeleton className='w-full h-8' />
                </SidebarMenuItem>
              </Fragment>
            )}

          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='py-6 px-4'>
        <div className='flex items-center gap-2'>
          <Avatar className='size-7'>
            <AvatarImage src='https://cdn.reddie.dev/assets/avatar.jpg' />
            <AvatarFallback>?</AvatarFallback>
          </Avatar>

          <span>
            {username}
          </span>
        </div>

      </SidebarFooter>

    </Sidebar>
  )
}

const queryClient = new QueryClient()

function MessageBoxComponent({ message }: { message: MessageData }) {
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
      <div className={cn("flex flex-col gap-1 max-w-[80%] md:max-w-[70%]", isUser && "items-end")}>
        {/* Header with name and role */}
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isUser && "flex-row-reverse")}>
          <span className="font-medium">{message.name}</span>

        </div>

        {/* Message bubble */}
        <Card className={cn("shadow-sm p-0", isUser ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50")}>
          <CardContent className="p-2">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </CardContent>
        </Card>

        {/* Timestamp */}
        <span className={cn("text-xs text-muted-foreground px-1", isUser && "text-right")}>
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

function MessagesContainer({ messages }: { messages: MessageData[] }) {
  const { username } = Route.useSearch()
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className='flex flex-col grow'>
      {messages.length == 0 &&
        <div className='flex flex-col items-start justify-center h-full'>
          <h1 className='text-2xl font-bold'>Hi {username}, how may I help you today?</h1>
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' className='cursor-pointer rounded-xl px-8 py-2 h-auto'>
              <StarsIcon />
              Create
            </Button>
            <Button variant='outline' className='cursor-pointer rounded-xl px-4 py-2 h-auto'>
              <NewspaperIcon />
              Explore
            </Button>
            <Button variant='outline' className='cursor-pointer rounded-xl px-4 py-2 h-auto'>
              <Code2Icon />
              Code
            </Button>
            <Button variant='outline' className='cursor-pointer rounded-xl px-4 py-2 h-auto'>
              <BookOpenIcon />
              Learn
            </Button>
          </div>
        </div>}
      {messages.map((message) => (
        <MessageBoxComponent key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}

const newMessageSchema = z.object({
  content: z.string().min(1),
})

type ChatResponse = {
  message: string;
  session: SessionData;
  messages: MessageData[];
}


function ChatContainer({ open }: { open: boolean }) {
  const { username } = Route.useSearch()
  const { session_id } = Route.useParams()


  const [messages, setMessages] = useState<MessageData[]>([])

  const { data: sessionData } = useQuery({
    queryKey: ['session', session_id],
    queryFn: () => getSession({ data: session_id }),

  })


  useEffect(() => {
    if (sessionData && 'messages' in sessionData) {
      setMessages(sessionData.messages)
    } else {
      setMessages([])
    }
  }, [sessionData, session_id])

  const form = useForm<z.infer<typeof newMessageSchema>>({
    resolver: zodResolver(newMessageSchema),
    defaultValues: {
      content: "",
    },
  })

  async function handleMessageSubmit(values: z.infer<typeof newMessageSchema>) {
    form.reset()
    const { content } = values


    // render latest message
    setMessages(prevMessages => [...prevMessages, {
      id: crypto.randomUUID(),
      role: "user",
      content: content,
      name: username,
      created_at: new Date().toISOString()
    }])

    // get response from backend 
    const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/chat`

    const response: AxiosResponse<ChatResponse> = await axios.post(url, {
      name: username,
      session_id: session_id,
      content: content
    })


    setMessages(prevMessages => [...prevMessages, {
      id: crypto.randomUUID(),
      role: "assistant",
      content: response.data.message,
      name: response.data.session.username,
      created_at: new Date().toISOString()
    }])


    if (messages.length == 0) {
      console.log("init invalidating sessions")
      setTimeout(async () => {
        console.log("started invalidating sessions")
        await queryClient.invalidateQueries({ queryKey: ['sessions'] })
        console.log("invalidated sessions")
      }, 4 * 1000)
    }
  }

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';

      // Calculate max height for 5 rows
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
      const padding = parseInt(getComputedStyle(textarea).paddingTop) * 2;
      const maxHeight = lineHeight * 5 + padding;

      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, []);


  return (
    <main className={cn('flex grow dark:bg-neutral-900 flex-col items-center justify-center rounded-lg transition-all duration-300 ease-in-out  overflow-y-scroll scrollbar-none', open && "mt-4 ml-4")}>
      <div className="flex flex-col max-w-[50rem] w-[50rem] h-full">
        <MessagesContainer messages={messages} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleMessageSubmit)} className="flex flex-col space-y-8">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>

                  <FormControl>
                    <div className="flex flex-row items-center gap-2 p-2 bg-neutral-950 rounded-xl rounded-b-none pb-0">
                      <div className="rounded-xl bg-neutral-900 w-full flex flex-col rounded-b-none pb-0">
                        <div className="p-2">
                          <Textarea
                            placeholder="Type your message..."
                            className="border-none p-2 scrollbar-none bg-neutral-900 px-0 py-2 dark:bg-neutral-900 dark:selection:bg-neutral-900 focus-visible:ring-0 resize-none"
                            onInput={adjustTextareaHeight}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                form.handleSubmit(handleMessageSubmit)();
                              }
                            }}
                            rows={1}
                            {...field}
                            ref={textareaRef}
                          />
                        </div>
                        <div className="p-2 pt-0 flex justify-between items-center">
                          <span>Qwen2.5 - Coder (1.5B)</span>
                          <Button size="icon" type="submit" className='cursor-pointer'>
                            <ArrowUp />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

      </div>
    </main>
  )
}

function RouteComponent() {
  const [open, setOpen] = useState(true)
  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <QueryClientProvider client={queryClient}>
        <div className=' bg-neutral-950 relative w-full font-display text-white min-h-screen max-h-screen h-screen flex flex-row'>
          <div>

            <SidebarTrigger className='absolute top-3 left-4 z-40 bg-neutral-950 p-4 rounded-lg shadow-lg cursor-pointer' />
          </div>
          <ThreadsSidebar />
          <ChatContainer open={open} />
        </div>
      </QueryClientProvider>
    </SidebarProvider>
  )
}
