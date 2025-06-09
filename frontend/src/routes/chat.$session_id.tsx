import { zodResolver } from '@hookform/resolvers/zod'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate, } from '@tanstack/react-router'
import axios, { AxiosResponse } from 'axios'
import { ArrowUp, BookOpenIcon, Code2Icon, MessageCircleIcon, NewspaperIcon, SearchIcon, StarsIcon } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { MessageBox } from '~/components/chat/messages'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { Skeleton } from '~/components/ui/skeleton'
import { Textarea } from '~/components/ui/textarea'


import { getSession, getSessions, getModels } from '~/lib/api'
import { MessageData } from '~/lib/api.types'
import { cn } from '~/lib/utils'

const queryClient = new QueryClient()

export const Route = createFileRoute('/chat/$session_id')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      username: (search.username as string) || 'User',
    }
  },
  beforeLoad: async () => {
    const models = await getModels()
    return {
      models: models,
    }
  },
  loader: async ({ params, context }) => {
    const session_id = params.session_id
    const models = context.models

    return {
      session_id: session_id,
      models: models,
    }
  },
  component: RouteComponent,
})

function ThreadsSidebar() {
  const { username } = Route.useSearch()
  const { data: sessions } = useQuery({
    queryKey: ['sessions', username],
    queryFn: () => getSessions({ data: encodeURIComponent(username) }),
    initialData: [],
    refetchInterval: 3 * 1000,
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

function MessagesContainer({ messages }: { messages: MessageData[] }) {
  const { username } = Route.useSearch()


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
        <MessageBox key={message.id} message={message} />
      ))}

    </div>
  )
}

function ChatContainer({ open }: { open: boolean }) {
  const { username } = Route.useSearch()
  const { session_id } = Route.useParams()
  const { models } = Route.useLoaderData()
  const mainRef = useRef<HTMLDivElement>(null)

  const newMessageSchema = z.object({
    content: z.string().min(1),
    model: z.string().min(1),
  })

  const [messages, setMessages] = useState<MessageData[]>([])

  const { data: sessionData } = useQuery({
    queryKey: ['session', session_id],
    queryFn: () => getSession({ data: session_id }),
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({
        top: mainRef.current.scrollHeight,
        behavior: 'smooth'
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
      model: models[0].model,
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

    // Create a temporary message for the assistant's response
    const tempMessageId = crypto.randomUUID()
    setMessages(prevMessages => [...prevMessages, {
      id: tempMessageId,
      role: "assistant",
      content: "",
      name: "Assistant",
      created_at: new Date().toISOString()
    }])

    // get streaming response from backend 
    const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/stream`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username,
          session_id: session_id,
          content: content,
          model: values.model
        })
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
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

        // Update the message with accumulated content
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === tempMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          )
        )
      }

      if (messages.length === 0) {
        console.log("init invalidating sessions")
        setTimeout(async () => {
          console.log("started invalidating sessions")
          await queryClient.invalidateQueries({ queryKey: ['sessions'] })
          console.log("invalidated sessions")
        }, 4 * 1000)
      }
    } catch (error) {
      console.error('Error:', error)
      // Remove the temporary message on error
      setMessages(prevMessages =>
        prevMessages.filter(msg => msg.id !== tempMessageId)
      )
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
    <main ref={mainRef} className={cn('flex grow dark:bg-neutral-900 flex-col items-center justify-center rounded-lg transition-all duration-300 ease-in-out overflow-y-scroll scrollbar-none', open && "mt-4 ml-4")}>
      <div className="flex flex-col max-w-[50rem] w-[50rem] h-full">
        <MessagesContainer messages={messages} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleMessageSubmit)} className="flex flex-col space-y-8">
            <div className="flex flex-row items-center gap-2 p-2 bg-neutral-950 rounded-xl rounded-b-none pb-0">
              <div className="rounded-xl bg-neutral-900 w-full flex flex-col rounded-b-none pb-0">
                <div className="p-2">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="p-2 pt-0 flex justify-between items-center">
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {models.map((model) => (
                              <SelectItem key={model.model} value={model.model}>{model.model}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                      </FormItem>
                    )}
                  />

                  <Button size="icon" type="submit" className='cursor-pointer'>
                    <ArrowUp />
                  </Button>
                </div>
              </div>
            </div>

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
        <div className='bg-neutral-950 relative w-full font-display text-white h-screen max-h-screen overflow-hidden flex flex-row'>
          <SidebarTrigger className='absolute top-3 left-4 z-40 bg-neutral-950 p-4 rounded-lg shadow-lg cursor-pointer' />
          <ThreadsSidebar />
          <ChatContainer open={open} />
        </div>
      </QueryClientProvider>
    </SidebarProvider>
  )
}
