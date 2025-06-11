import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate, } from '@tanstack/react-router'
import { ArrowUp, BookOpenIcon, Code2Icon, MessageCircleIcon, NewspaperIcon, SearchIcon, StarsIcon } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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


import { getSession, getSessions, getModels, streamCompletion } from '~/lib/api'
import { MessageData } from '~/lib/api.types'
import { cn } from '~/lib/utils'
import ModelsChecker from '~/components/chat/models-checker'


export const Route = createFileRoute('/chat/$session_id')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      username: (search.username as string) || 'User',
    }
  },
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
  const { username } = Route.useSearch()
  const { session_id } = Route.useParams()
  const { data: sessions, } = useQuery({
    queryKey: ['sessions', username, session_id],
    queryFn: () => getSessions({ data: { name: encodeURIComponent(username), session_id } }),
    initialData: [],
  })
  const navigate = useNavigate()

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
    const session_id = crypto.randomUUID()
    navigate({ to: '/chat/$session_id', params: { session_id }, search: { username } })
  }

  return (
    <Sidebar className='dark:bg-neutral-950 bg-neutral-950 z-10 '>

      <SidebarHeader className='pt-4' >
        <Link to="/" className='px-4 gap-2 flex flex-row justify-center items-center font-bold'>
          <img src="/logo.png" alt="Bard" className='size-5' height={512} width={512} />
          <span>Bard</span>
        </Link>
      </SidebarHeader>


      <div className='px-4 pt-2'>
        <Button id='new-thread-button' className='w-full cursor-pointer justify-center' onClick={handleNewThread}>
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
                      <span className="truncate">{formatTitle(session.title)}</span>
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
        <p className='text-neutral-500 text-left text-xs font-mono pb-2'>
          [cmd/ctrl + /] for new thread
          [cmd/ctrl + b] toggle sidebar
        </p>
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
    <div className='flex flex-col grow pb-52'>
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

  if (models.length == 0) {
    toast.error("No Ollama models found", {
      description: "Please check your backend configuration and make sure that Ollama is running and that the models are loaded.",
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
  const isScrollingRef = useRef(false)

  const { data: sessionData, isFetched: isSessionFetched } = useQuery({
    queryKey: ['session', session_id],
    queryFn: () => getSession({ data: session_id }),
    initialData: { session: initialSession, messages: initialMessages },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    if (mainRef.current && !isScrollingRef.current) {
      isScrollingRef.current = true

      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (mainRef.current) {
          mainRef.current.scrollTo({
            top: mainRef.current.scrollHeight,
            behavior: 'smooth'
          })

          // Reset scroll lock after animation completes
          setTimeout(() => {
            isScrollingRef.current = false
          }, 300) // Typical duration of smooth scroll
        }
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
      model: models.length > 0 ? models[0].model : "gemma3:1b",
    },
  })

  // get streaming response from backend 
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

    try {
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
    <main ref={mainRef} className={cn('flex relative grow dark:bg-neutral-900 flex-col items-center justify-center rounded-lg transition-all duration-300 scrollbar scrollbar-track-neutral-900 scrollbar-thumb-neutral-500 ease-in-out overflow-y-scroll', open && "mt-4 ml-4")}>
      <div className="flex flex-col max-w-[50rem] w-[50rem] h-full">
        {isSessionFetched && messages.length == 0 &&
          <div className='flex flex-col grow pb-40'>
            <div className='flex flex-col items-start justify-center h-full'>
              <h1 className='text-4xl font-bold'>Hi {username}, how may I help you today?</h1>
              <p className='text-neutral-500 pt-5'>
                Here are some examples of what you can ask me:
              </p>
              <div className='flex flex-wrap gap-2 mt-2'>
                <Button variant='outline' className='cursor-pointer rounded-xl px-8 py-2 h-auto' onClick={() => {
                  form.setValue("content", "Compose a poem about the changing seasons.")
                  const textarea = document.getElementById('message-input') as HTMLTextAreaElement
                  textarea?.focus()
                  adjustTextareaHeight()
                }}>
                  <StarsIcon />
                  Create
                </Button>
                <Button variant='outline' className='cursor-pointer rounded-xl px-4 py-2 h-auto' onClick={() => {
                  form.setValue("content", "What are some unique travel destinations in the Philippines?")
                  const textarea = document.getElementById('message-input') as HTMLTextAreaElement
                  textarea?.focus()
                  adjustTextareaHeight()
                }}>
                  <NewspaperIcon />
                  Explore
                </Button>
                <Button variant='outline' className='cursor-pointer rounded-xl px-4 py-2 h-auto' onClick={() => {
                  form.setValue("content", "Write a Python script to sort a list of numbers.")
                  const textarea = document.getElementById('message-input') as HTMLTextAreaElement
                  textarea?.focus()
                  adjustTextareaHeight()
                }}>
                  <Code2Icon />
                  Code
                </Button>
                <Button variant='outline' className='cursor-pointer rounded-xl px-4 py-2 h-auto' onClick={() => {
                  form.setValue("content", "Teach me the basics of machine learning.")
                  const textarea = document.getElementById('message-input') as HTMLTextAreaElement
                  textarea?.focus()
                  adjustTextareaHeight()
                }}>
                  <BookOpenIcon />
                  Learn
                </Button>
              </div>
            </div>


          </div>}
        {isSessionFetched && messages.length > 0 && <MessagesContainer messages={messages} />}
        <div className='fixed bottom-0 z-40 max-w-[50rem] w-full'>
          <p className='text-neutral-500 text-right text-xs font-mono pb-2'>
            [shift + enter] for new line
            [enter] to send message
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleMessageSubmit)} className="flex flex-col space-y-8 w-full" >
              <div className="isolate backdrop-blur-sm flex flex-row items-center gap-2 p-2 bg-neutral-800/20 border-[1px] border-b-0 border-neutral-800 rounded-xl rounded-b-none pb-0">
                <div className="isolate rounded-xl bg-neutral-800/20 border-[1px] border-b-0 border-neutral-800 w-full flex flex-col rounded-b-none pb-0">
                  <div className="p-2">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              id='message-input'
                              placeholder="Type your message..."
                              className="border-none p-2 scrollbar-none bg-transparent dark:bg-transparent not-[]: px-0 py-2  focus-visible:ring-0 resize-none"
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
                          <FormMessage id='model-input-message' />
                        </FormItem>
                      )}
                    />
                    <Button size="icon" id='send-message-button' type="submit" className='cursor-pointer' disabled={models.length == 0}>
                      <ArrowUp />
                    </Button>
                  </div>

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

      <div className='bg-neutral-950 relative w-full font-display antialiased scroll-smooth text-white h-screen max-h-screen overflow-hidden flex flex-row'>
        <SidebarTrigger className='absolute top-3 left-4 z-40 bg-neutral-950 p-4 rounded-lg shadow-lg cursor-pointer' />
        <ThreadsSidebar />
        <ChatContainer open={open} />
      </div>

    </SidebarProvider>
  )
}
