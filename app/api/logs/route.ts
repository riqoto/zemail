import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '200')

  const { data, error } = await supabase
    .from('app_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { log_type, event_type, status, message, metadata } = body

  if (!log_type || !event_type || !status) {
    return NextResponse.json(
      { error: 'log_type, event_type, and status are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('app_logs')
    .insert([{ log_type, event_type, status, message: message || null, metadata: metadata || {} }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
