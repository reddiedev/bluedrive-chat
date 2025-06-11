/// <reference types="vite/client" />

interface ViteTypeOptions {
  // strictImportMetaEnv: true
}

interface ImportMetaEnv {
  readonly BACKEND_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}