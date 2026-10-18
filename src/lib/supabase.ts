import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// The client is intentionally optional until the first Supabase project is linked.
export const supabase = url && key ? createClient(url, key) : null
