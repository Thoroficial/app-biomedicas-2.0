import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  name: string
  created_at: string
}

export type Procedure = {
  id: string
  user_id?: string
  name: string
  description?: string
  created_at: string
}

export type ProcedureExample = {
  id: string
  procedure_id: string
  user_id: string
  before_image_url: string
  after_image_url: string
  ml_used?: number
  notes?: string
  created_at: string
}
