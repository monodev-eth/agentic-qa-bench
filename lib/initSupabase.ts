/**
 * In benchmark mode (default) this exports an in-memory mock client that
 * implements just enough of the Supabase JS surface for the app to run
 * without any external services. Set `NEXT_PUBLIC_USE_REAL_SUPABASE=true`
 * to use the real Supabase client instead.
 */
import { mockClient } from './mockClient'

const USE_REAL_SUPABASE = process.env.NEXT_PUBLIC_USE_REAL_SUPABASE === 'true'

export const supabase: any = USE_REAL_SUPABASE
  ? (() => {
      const { createBrowserClient } = require('@supabase/ssr')
      return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      )
    })()
  : mockClient
