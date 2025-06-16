import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kkbrcngfywhennqouwns.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYnJjbmdmeXdoZW5ucW91d25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNjc0MTMsImV4cCI6MjA2NTY0MzQxM30.l156-lHYGgMbMptJqRsQQbG6xw_1TW-2ssWcOwmZDeQ"

export const supabase = createClient(supabaseUrl, supabaseKey)

