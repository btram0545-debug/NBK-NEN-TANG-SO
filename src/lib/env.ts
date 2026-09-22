const e = import.meta.env

export const env = {
  supabaseUrl: e.VITE_SUPABASE_URL || undefined,
  supabaseKey: e.VITE_SUPABASE_PUBLISHABLE_KEY || undefined,
  schoolName: e.VITE_SCHOOL_NAME || 'Trường THPT Nguyễn Bỉnh Khiêm',
  quickExitUrl: e.VITE_QUICK_EXIT_URL || 'https://www.google.com',
  accountEmailDomain: e.VITE_ACCOUNT_EMAIL_DOMAIN || 'school.example',
}

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseKey)
/** Không cấu hình Supabase => chạy demo với dữ liệu mẫu trong bộ nhớ trình duyệt. */
export const isDemoMode = !isSupabaseConfigured
export const showDemoAccounts = isDemoMode || (e.DEV && e.VITE_SHOW_DEMO_ACCOUNTS === 'true')
