/// <reference types="vite/client" />

interface ViteTypeOptions {
  // strictImportMetaEnv: true
}

interface ImportMetaEnv {
  readonly BACKEND_BASE_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}