import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getUser } from '~/lib/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getUser()

    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    return { user }
  },
  component: () => <Outlet />,
})
