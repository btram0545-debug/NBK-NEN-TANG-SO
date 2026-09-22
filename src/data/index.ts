import type { Api } from './api'
import { mockApi } from './mockApi'
import { supabaseApi } from './supabaseApi'
import { isDemoMode } from '@/lib/env'

export type { Api } from './api'
/** Có VITE_SUPABASE_* => dữ liệu thật; không có => demo (dữ liệu mẫu, không lưu). */
export const api: Api = isDemoMode ? mockApi : supabaseApi
