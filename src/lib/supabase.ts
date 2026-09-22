import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Chỉ dùng publishable (anon) key. Không bao giờ đưa service-role key vào frontend.
export const supabase =
  env.supabaseUrl && env.supabaseKey
    ? createClient(env.supabaseUrl, env.supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      })
    : null
