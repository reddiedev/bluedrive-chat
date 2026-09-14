import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate, } from '@tanstack/react-router'
import { ArrowUp, BookOpenIcon, Code2Icon, LogOut, MessageCircleIcon, NewspaperIcon, SearchIcon, StarsIcon } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { BardMark } from '~/components/bard-mark'
import { MessageBox } from '~/components/chat/messages'
import { RecitationTrace, ThreadFingerprint } from '~/components/chat/recitation-trace'
import { ThemeSwitch } from '~/components/theme-switch'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'


import { getSession, getSessions, getModels, streamCompletion } from '~/lib/api'
import { MessageData } from '~/lib/api.types'
import { cn, randomUUID } from '~/lib/utils'
import ModelsChecker from '~/components/chat/models-checker'


export const Route = createFileRoute('/_authed/chat/$session_id')({
  beforeLoad: async ({ params }) => {
    const models = await getModels()
    const session_id = params.session_id
    const sessionData = await getSession({ data: session_id })
    return {
      models: models,
      session: sessionData.session,
      messages: sessionData.messages,
    }
  },
  loader: async ({ params, context }) => {
    const session_id = params.session_id
    const models = context.models

    return {
      session_id: session_id,
      models: models,
      session: context.session,
      messages: context.messages,
    }
  },
  component: RouteComponent,
})

function ThreadsSidebar() {
  const { user } = Route.useRouteContext()
  const username = user.email ?? 'User'
  const { session_id } = Route.useParams()
  const [query, setQuery] = useState('')
  const { data: sessions } = useQuery({
    queryKey: ['sessions', username, session_id],
    queryFn: () => getSessions({ data: { name: encodeURIComponent(username), session_id } }),
    initialData: [],
    refetchInterval: (query) => {
      const newSession = query.state.data?.find((session) => session.title === "🧵 New Thread")
      return newSession ? 3 * 1000 : false
    },
  })

  const navigate = useNavigate()

  const visibleSessions = (sessions ?? []).filter((session) =>
    session.title.toLowerCase().includes(query.trim().toLowerCase()),
  )

  const isEmoji = (str: string) => {
    const emojiRegex = /[\p{Emoji}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]/u;
    return emojiRegex.test(str);
  }

  const formatTitle = (title: string) => {
    const words = title.split(' ');
    if (words.length > 0 && isEmoji(words[0])) {
      return `${words[0]}\u00A0\u00A0${words.slice(1).join(' ')}`;
    }
    return title;
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + Shift + O
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === '/') {
        handleNewThread()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNewThread])

  async function handleNewThread() {
    const session_id = randomUUID()
    navigate({ to: '/chat/$session_id', params: { session_id } })
  }

  return (
    <Sidebar className='border-sidebar-border border-r'>

      <SidebarHeader className='px-4 pt-5'>
        <div className='flex items-center justify-between gap-2'>
          <Link to='/' className='flex flex-row items-center gap-2 font-semibold tracking-tight'>
            <BardMark className='size-5 text-foreground' />
            <span>Bard</span>
          </Link>
          <SidebarTrigger className='cursor-pointer' />
        </div>
      </SidebarHeader>


      <div className='px-4 pt-4'>
        <Button id='new-thread-button' className='w-full cursor-pointer justify-center' onClick={handleNewThread}>
          <MessageCircleIcon />
          New thread
        </Button>
      </div>

      <SidebarContent className='px-2 pt-4'>
        <SidebarGroup className='px-0'>
          <div className='flex flex-row items-center gap-2 px-2'>
            <SearchIcon className='text-muted-foreground size-4 shrink-0' />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search your threads'
              className='h-auto border-none bg-transparent px-0 py-2 shadow-none focus-visible:ring-0'
              spellCheck={false}
              autoComplete='off'
            />
          </div>
          <SidebarGroupLabel className='text-muted-foreground px-2 font-mono text-[11px] tracking-[0.18em] uppercase'>
            What the room remembers
          </SidebarGroupLabel>
          <SidebarGroupContent className='flex flex-col gap-1'>
            {visibleSessions.map((session) =>
              <SidebarMenuItem key={session.id}>
                <SidebarMenuButton asChild isActive={session.id === session_id}>
                  <Link to={`/chat/$session_id`} params={{ session_id: session.id }} className='cursor-pointer'>
                    <ThreadFingerprint seed={`${session.title}:${session.id}`} />
                    <span className="truncate">{formatTitle(session.title)}</span>
                  </Link>
                </SidebarMenuButton>
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
            {sessions.length > 0 && visibleSessions.length === 0 && (
              <p className='text-muted-foreground px-2 py-3 text-sm'>
                No threads match “{query}”.
              </p>
            )}

          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='px-4 py-5'>
        <p className='text-muted-foreground pb-3 font-mono text-[11px] leading-relaxed'>
          [cmd/ctrl + /] new thread
          <br />
          [cmd/ctrl + b] toggle sidebar
        </p>
        <div className='pb-3'>
          <ThemeSwitch />
        </div>
        <Separator className='mb-4' />
        <div className='flex items-center gap-2 justify-between'>
          <div className='flex items-center gap-2 min-w-0'>
            <Avatar className='size-7'>
              <AvatarImage src='https://cdn.reddie.dev/assets/avatar.jpg' alt="" />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>

            <span className='truncate text-sm'>
              {username}
            </span>
          </div>

          <Link to='/logout' title='Sign out'>
            <Button variant='ghost' size='icon' className='cursor-pointer shrink-0'>
              <LogOut />
            </Button>
          </Link>
        </div>

      </SidebarFooter>

    </Sidebar>
  )
}



function MessagesContainer({ messages }: { messages: MessageData[] }) {
  return (
    <div className='flex flex-col pb-4'>
      {messages.map((message) => (
        <MessageBox key={message.id} message={message} />
      ))}

    </div>
  )
}

const SUGGESTIONS = [
  { Icon: StarsIcon, label: 'Create', prompt: 'Compose a poem about the changing seasons.' },
  { Icon: NewspaperIcon, label: 'Explore', prompt: 'What are some unique travel destinations in the Philippines?' },
  { Icon: Code2Icon, label: 'Code', prompt: 'Write a Python script to sort a list of numbers.' },
  { Icon: BookOpenIcon, label: 'Learn', prompt: 'Teach me the basics of machine learning.' },
]

function ChatContainer({ open }: { open: boolean }) {
  const { user } = Route.useRouteContext()
  const username = user.email ?? 'User'
  const { session_id } = Route.useParams()
  const { models } = Route.useLoaderData()

  if (models.length == 0) {
    toast.error("No models found", {
      description: "Please check your backend configuration and make sure that the LLM provider is reachable and that the models are configured.",
      duration: 10000,
      id: "no-models-found",

    })
  }


  const { session: initialSession, messages: initialMessages } = Route.useLoaderData()

  const newMessageSchema = z.object({
    content: z.string()
      .min(1, "Message cannot be empty")
      .max(99999, "Message is too long (maximum 99999 characters)"),
    model: z.string()
      .min(1, "Please select a model")
      .max(255, "Model name is too long"),
  })

  const [messages, setMessages] = useState<MessageData[]>([])
  const [streaming, setStreaming] = useState(false)
  const [pulse, setPulse] = useState(0)
  const isScrollingRef = useRef(false)

  const { data: sessionData, isFetched: isSessionFetched } = useQuery({
    queryKey: ['session', session_id],
    queryFn: () => getSession({ data: session_id }),
    initialData: { session: initialSession, messages: initialMessages },
  })

  // The document scrolls, so we scroll the window to the newest message.
  useEffect(() => {
    if (!isScrollingRef.current) {
      isScrollingRef.current = true

      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth',
        })

        // Reset scroll lock after animation completes
        setTimeout(() => {
          isScrollingRef.current = false
        }, 300) // Typical duration of smooth scroll
      })
    }
  }, [messages])

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
      model: models.length > 0 ? models[0].model : "",
    },
  })

  // get streaming response from backend 
  async function handleMessageSubmit(values: z.infer<typeof newMessageSchema>) {
    form.reset()
    requestAnimationFrame(adjustTextareaHeight)
    const { content } = values

    // render latest message
    setMessages(prevMessages => [...prevMessages, {
      id: randomUUID(),
      role: "user",
      content: content,
      name: username,
      created_at: new Date().toISOString()
    }])

    // Create a temporary message for the assistant's response
    const tempMessageId = randomUUID()
    setMessages(prevMessages => [...prevMessages, {
      id: tempMessageId,
      role: "assistant",
      content: "",
      name: "Assistant",
      created_at: new Date().toISOString()
    }])

    try {
      setStreaming(true)
      const response = await streamCompletion({
        data: {
          name: username,
          session_id: session_id,
          content: content,
          model: values.model
        },

      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to send message')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Convert the Uint8Array to text
        const chunk = new TextDecoder().decode(value)
        accumulatedContent += chunk
        setPulse(prev => prev + 1)

        // Update the message with accumulated content
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === tempMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        )
      }
    } catch (error) {
      console.error('Error:', error)
      // Remove the temporary message on error
      setMessages(prevMessages =>
        prevMessages.filter(msg => msg.id !== tempMessageId)
      )
      // Add error message to the form
      form.setError('content', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Failed to send message'
      })
    } finally {
      setStreaming(false)
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

  function useSuggestion(prompt: string) {
    form.setValue("content", prompt)
    const textarea = document.getElementById('message-input') as HTMLTextAreaElement
    textarea?.focus()
    adjustTextareaHeight()
  }

  return (
    <main className={cn('bg-background relative flex w-full grow flex-col', open && "md:ml-4")}>
      {/* The document scrolls, so the scrollbar lives at the window edge and
          keyboard scrolling works. The transcript is centred and width-capped;
          the composer sticks to the bottom of the viewport. */}
      <div className='mx-auto flex w-full max-w-[50rem] grow flex-col px-4 pt-10 sm:px-6 md:pt-6'>
          {isSessionFetched && messages.length == 0 &&
            <div className='flex flex-1 flex-col justify-center py-16'>
              <p className='text-muted-foreground font-mono text-[11px] tracking-[0.22em] uppercase'>
                A new thread
              </p>
              <h1 className='font-display mt-4 text-3xl font-light leading-tight tracking-tight text-balance sm:text-4xl'>
                Hi {username}, what are we working on?
              </h1>
              <p className='text-muted-foreground mt-4 font-mono text-xs'>
                Pick a starting point, or just start typing.
              </p>
              <div className='mt-6 flex flex-wrap gap-2'>
                {SUGGESTIONS.map(({ Icon, label, prompt }) => (
                  <Button
                    key={label}
                    variant='outline'
                    className='h-auto cursor-pointer rounded-full px-4 py-2'
                    onClick={() => useSuggestion(prompt)}
                  >
                    <Icon />
                    {label}
                  </Button>
                ))}
              </div>
            </div>}
          {isSessionFetched && messages.length > 0 && <MessagesContainer messages={messages} />}
      </div>

      <div className='bg-background sticky bottom-0 z-30'>
        <div className='mx-auto w-full max-w-[50rem] px-4 pt-2 pb-4 sm:px-6'>
          <p className='text-muted-foreground pb-2 text-right font-mono text-[11px]'>
            [shift + enter] new line · [enter] send
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleMessageSubmit)} className="w-full" >
              <div className="bg-card border-border flex flex-col overflow-hidden rounded-[10px] border shadow-sm">
                <div className="p-2">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            id='message-input'
                            placeholder="Type a message…"
                            className="scrollbar-none resize-none border-none bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
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
                        </FormControl>
                        <FormMessage id='message-input-message' />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 px-2 pb-2">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-muted-foreground border-none bg-transparent shadow-none focus-visible:ring-0">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {models.map((model) => (
                              <SelectItem key={model.model} value={model.model}>{model.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage id='model-input-message' />
                      </FormItem>
                    )}
                  />
                  <Button size="icon" id='send-message-button' type="submit" className='cursor-pointer' disabled={models.length == 0}>
                    <ArrowUp />
                  </Button>
                </div>
                <div className='border-border/70 border-t'>
                  <RecitationTrace active={streaming} pulse={pulse} className='h-5 w-full' />
                </div>
              </div>

            </form>
          </Form>
        </div>
      </div>
    </main>
  )
}

function RouteComponent() {
  const [open, setOpen] = useState(true)
  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <ModelsChecker />

      <div className='bg-background text-foreground relative flex min-h-svh w-full flex-row'>
        <SidebarTrigger className='bg-background fixed top-3 left-3 z-40 shadow-sm md:hidden' />
        <ThreadsSidebar />
        <ChatContainer open={open} />
      </div>

    </SidebarProvider>
  )
}
