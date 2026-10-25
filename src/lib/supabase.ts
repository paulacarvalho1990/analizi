import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://cmhinsmiikjzmqludwzs.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtaGluc21paWtqem1xbHVkd3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNzQwMzQsImV4cCI6MjEwNzg1MDAzNH0.RjG5cAvuSxkJdH2IMNrHzfTP59TgZIfT3Lu6Z1tej5s'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const url = rawUrl && !rawUrl.includes('placeholder') ? rawUrl : DEFAULT_SUPABASE_URL
const key = rawKey && !rawKey.includes('placeholder') && !rawKey.includes('cole_a_chave') ? rawKey : DEFAULT_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

