import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.split(' ')[1]
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  return user
}
