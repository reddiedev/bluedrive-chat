import { createFileRoute, } from '@tanstack/react-router'
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import axios, { AxiosResponse } from 'axios'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { Button } from '~/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'

// UUID v4 validation regex
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const Route = createFileRoute('/chat/$session_id')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      username: (search.username as string) || 'Anonymous',
    }
  },
  beforeLoad: ({ params }) => {
    const session_id = params.session_id
    if (!UUID_V4_REGEX.test(session_id)) {
      throw redirect({
        to: '/',
      })
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
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => getSessions({ data: username }),
    initialData: []
  })

  return (
    <Sidebar className='dark:bg-neutral-950 bg-neutral-950'>


      <SidebarHeader className='px-4 pt-6'>
        <div className='flex items-center gap-2'>
          <Avatar className='size-6'>
            <AvatarImage src='https://cdn.reddie.dev/assets/avatar.jpg' />
            <AvatarFallback>?</AvatarFallback>
          </Avatar>

          {username}
        </div>

      </SidebarHeader>


      <SidebarContent className='dark:bg-neutral-950 bg-neutral-950 text-white'>
        <SidebarGroup>
          <SidebarGroupLabel className='text-white'>
            Threads
          </SidebarGroupLabel>
          <SidebarGroupContent className='flex flex-col gap-2'>
            {sessions?.map((session) =>
              <SidebarMenuItem key={session.id}>
                <SidebarMenuButton asChild>
                  <Button variant='ghost' className='cursor-pointer justify-start truncate'>
                    {session.title}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>)}

          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  )
}



const queryClient = new QueryClient()

function ChatContainer() {
  return (
    <div className='flex grow'>

    </div>
  )
}



function RouteComponent() {
  const { session_id } = Route.useParams()
  const { username } = Route.useSearch()


  return (
    <SidebarProvider>

      <QueryClientProvider client={queryClient}>

        <div className='bg-neutral-950 w-full font-display text-white min-h-screen max-h-screen h-screen flex flex-row'>
          <ThreadsSidebar />
          <main>
            <SidebarTrigger />
            <ChatContainer />
          </main>

        </div>
      </QueryClientProvider>
    </SidebarProvider>


  )
}
