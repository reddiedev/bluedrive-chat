import { defineConfig } from '@tanstack/react-start/config'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  tsr: {
    appDirectory: 'src',
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      {
        name: 'report-hmr-ports',
        configureServer: ({ config }) => {
          const hmr = config.server.hmr
          if (typeof hmr === 'object' && 'port' in hmr) {
            console.log(
              `\x1b[34mHMR\x1b[0m is listening to \x1b[32mhttp://localhost:${hmr.port}\x1b[0m`,
            )
          }
        },
      },
    ],
  },
  server: {
    preset: 'node-server',
  },
  routers:{
    client:{
      vite:{
        // @ts-ignore
        server:{
          hmr:{
            port: 3124
          }
        }
      }
    }
  }
})
