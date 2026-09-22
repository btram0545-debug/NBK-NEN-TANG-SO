/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_SCHOOL_NAME?: string
  readonly VITE_QUICK_EXIT_URL?: string
  readonly VITE_ACCOUNT_EMAIL_DOMAIN?: string
  readonly VITE_SHOW_DEMO_ACCOUNTS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
