import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import type * as React from 'react'
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary'
import { NotFound } from '~/components/NotFound'
import appCss from '~/styles/app.css?url'
import { seo } from '~/utils/seo'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title:
          'Bard | AI Chatbot',
        description: `Bard is an AI chatbot that can help you with your questions and tasks.`,
      }),
    ],
    links: [
      { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.css" },
      { rel: 'stylesheet', href: appCss, suppressHydrationWarning: false },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
    scripts: [
      /* { crossOrigin: 'anonymous', src: 'https://unpkg.com/react-scan/dist/auto.global.js' }, */
      { src: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js" },
      { src: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/python.min.js" },
      { src: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/javascript.min.js" },
      { src: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/typescript.min.js" }
    ]
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    )
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
})

function RootComponent() {
  return (

    <RootDocument>
      <Outlet />
    </RootDocument>

  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
