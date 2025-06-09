/// <reference types="vite/client" />

interface ViteTypeOptions {
  // strictImportMetaEnv: true
}

interface ImportMetaEnv {
  readonly VITE_BACKEND_BASE_URL: string
  readonly BACKEND_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}