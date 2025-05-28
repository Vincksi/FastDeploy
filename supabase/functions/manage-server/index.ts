
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { action, serverId, ...params } = await req.json()

    switch (action) {
      case 'start':
        return await startServer(supabaseClient, serverId, user.id)
      case 'stop':
        return await stopServer(supabaseClient, serverId, user.id)
      case 'create':
        return await createServer(supabaseClient, params, user.id)
      case 'delete':
        return await deleteServer(supabaseClient, serverId, user.id)
      default:
        return new Response('Invalid action', { status: 400, headers: corsHeaders })
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response('Internal Server Error', { status: 500, headers: corsHeaders })
  }
})

async function startServer(supabase: any, serverId: string, userId: string) {
  // Update server status to running
  const { error } = await supabase
    .from('servers')
    .update({ status: 'running' })
    .eq('id', serverId)
    .eq('user_id', userId)

  if (error) throw error

  // Add log entry
  await supabase
    .from('server_logs')
    .insert({
      server_id: serverId,
      level: 'SUCCESS',
      message: 'Server started successfully'
    })

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function stopServer(supabase: any, serverId: string, userId: string) {
  // Update server status to stopped
  const { error } = await supabase
    .from('servers')
    .update({ status: 'stopped' })
    .eq('id', serverId)
    .eq('user_id', userId)

  if (error) throw error

  // Add log entry
  await supabase
    .from('server_logs')
    .insert({
      server_id: serverId,
      level: 'INFO',
      message: 'Server stopped'
    })

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function createServer(supabase: any, params: any, userId: string) {
  // Find available port
  const { data: existingServers } = await supabase
    .from('servers')
    .select('port')
    .eq('user_id', userId)

  const usedPorts = existingServers?.map((s: any) => s.port) || []
  let port = 8000
  while (usedPorts.includes(port)) {
    port++
  }

  // Create new server
  const { data, error } = await supabase
    .from('servers')
    .insert({
      name: params.name || `API-${Date.now()}`,
      description: params.description,
      port,
      user_id: userId,
      status: 'creating',
      repository_url: params.repository_url,
      environment_variables: params.environment_variables || {}
    })
    .select()
    .single()

  if (error) throw error

  // Simulate server creation process
  setTimeout(async () => {
    await supabase
      .from('servers')
      .update({ status: 'running' })
      .eq('id', data.id)

    await supabase
      .from('server_logs')
      .insert({
        server_id: data.id,
        level: 'SUCCESS',
        message: 'Server created and started successfully'
      })
  }, 3000)

  // Add initial log
  await supabase
    .from('server_logs')
    .insert({
      server_id: data.id,
      level: 'INFO',
      message: 'Creating new FastAPI server...'
    })

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function deleteServer(supabase: any, serverId: string, userId: string) {
  const { error } = await supabase
    .from('servers')
    .delete()
    .eq('id', serverId)
    .eq('user_id', userId)

  if (error) throw error

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
