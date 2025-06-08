import { createFileRoute, Link, useNavigate, } from '@tanstack/react-router'
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import axios, { AxiosResponse } from 'axios'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { Button } from '~/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { ArrowUp, MessageCircleIcon, SearchIcon, SendIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '~/lib/utils'
import { Input } from '~/components/ui/input'
import { Separator } from '~/components/ui/separator'
import { Textarea } from '~/components/ui/textarea'

// UUID v4 validation regex
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const sanitizeString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export const Route = createFileRoute('/chat/$session_id')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      username: (search.username as string) || 'User',
    }
  },
  loader: async ({ params }) => {
    console.log("loader", params)
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

export const getSessions = createServerFn({
  method: 'GET',
  response: 'data',
}).validator((name: string) => {
  return {
    name: name,
  }
}).handler(async ({ data }) => {
  try {
    const url = `${process.env.BACKEND_BASE_URL}/sessions`
    const response: AxiosResponse<SessionData[]> = await axios(url, {
      method: "GET",
      params: {
        name: data.name
      }
    })
    return response.data
  } catch (err) {
    console.error(err)
    return []
  }
})

function ThreadsSidebar() {
  const { username } = Route.useSearch()
  const sanitizedUsername = sanitizeString(username)
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions({ data: sanitizedUsername }),
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

function MessageInputComponent() {
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

      // Show/hide scrollbar based on content

    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  return (
    <div className="flex flex-row items-center gap-2 p-2 bg-neutral-950 rounded-xl rounded-b-none pb-0">
      <div className="rounded-xl bg-neutral-900 w-full flex flex-col rounded-b-none pb-0">
        <div className="p-2">
          <Textarea
            ref={textareaRef}
            placeholder="Type your message..."
            className="border-none p-2 scrollbar-none bg-neutral-900 px-0 py-2 dark:bg-neutral-900 dark:selection:bg-neutral-900 focus-visible:ring-0 resize-none"
            onInput={adjustTextareaHeight}
            rows={1}
          />
        </div>
        <div className="p-2 pt-0 flex justify-between items-center">
          <span>Qwen2.5 - Coder (1.5B)</span>
          <Button size="icon" className='cursor-pointer'>
            <ArrowUp />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessagesContainer() {
  return (<div className='flex flex-col grow'>

  </div>)
}
function ChatContainer({ open }: { open: boolean }) {
  const { username } = Route.useSearch()
  return (
    <main className={cn('flex grow dark:bg-neutral-900 flex-col items-center justify-center rounded-lg transition-all duration-300 ease-in-out', open && "mt-4 ml-4")}>
      <div className="flex flex-col max-w-[50rem] w-[50rem] h-full">
        <MessagesContainer />
        <MessageInputComponent />
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
