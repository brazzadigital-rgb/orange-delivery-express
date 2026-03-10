import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const IFOOD_ORDER_URL = 'https://merchant-api.ifood.com.br/order/v1.0/orders'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify admin/staff role
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .in('role', ['admin', 'staff'])
      .limit(1)

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin/Staff access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { orderId, action, reason, code } = await req.json()

    // Get order with connection info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, ifood_connections!orders_merchant_id_ifood_fkey(*)')
      .eq('id', orderId)
      .eq('channel', 'ifood')
      .single()

    if (orderError || !order) {
      // Try alternative query
      const { data: orderAlt, error: orderAltError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('channel', 'ifood')
        .single()

      if (orderAltError || !orderAlt) {
        return new Response(JSON.stringify({ error: 'iFood order not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Get connection separately
      const { data: connection } = await supabase
        .from('ifood_connections')
        .select('*')
        .eq('store_id', orderAlt.store_id)
        .eq('enabled', true)
        .single()

      if (!connection || !connection.access_token) {
        return new Response(JSON.stringify({ error: 'No active iFood connection' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return await handleAction(supabase, orderAlt, connection, action, reason, code, userData.user.id)
    }

    // Get connection
    const { data: connection } = await supabase
      .from('ifood_connections')
      .select('*')
      .eq('store_id', order.store_id)
      .eq('enabled', true)
      .single()

    if (!connection || !connection.access_token) {
      return new Response(JSON.stringify({ error: 'No active iFood connection' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return await handleAction(supabase, order, connection, action, reason, code, userData.user.id)

  } catch (error) {
    console.error('Error in ifood-order-actions:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleAction(
  supabase: any, 
  order: any, 
  connection: any, 
  action: string, 
  reason?: string, 
  code?: string,
  userId?: string
) {
  const ifoodOrderId = order.external_order_id
  const accessToken = connection.access_token

  let endpoint = ''
  let method = 'POST'
  let body: any = undefined
  let newStatus = order.status

  switch (action) {
    case 'confirm':
      endpoint = `${IFOOD_ORDER_URL}/${ifoodOrderId}/confirm`
      newStatus = 'accepted'
      break

    case 'dispatch':
      endpoint = `${IFOOD_ORDER_URL}/${ifoodOrderId}/dispatch`
      newStatus = 'out_for_delivery'
      break

    case 'readyForPickup':
      endpoint = `${IFOOD_ORDER_URL}/${ifoodOrderId}/readyToPickup`
      newStatus = 'ready'
      break

    case 'requestCancellation':
      endpoint = `${IFOOD_ORDER_URL}/${ifoodOrderId}/requestCancellation`
      body = { reason, cancellationCode: code }
      newStatus = 'canceled'
      break

    case 'getCancellationReasons':
      const reasonsResponse = await fetch(`${IFOOD_ORDER_URL}/${ifoodOrderId}/cancellationReasons`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      
      if (!reasonsResponse.ok) {
        const errorText = await reasonsResponse.text()
        return new Response(JSON.stringify({ error: 'Failed to get cancellation reasons', details: errorText }), {
          status: reasonsResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const reasons = await reasonsResponse.json()
      return new Response(JSON.stringify({ reasons }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    case 'getDetails':
      const detailsResponse = await fetch(`${IFOOD_ORDER_URL}/${ifoodOrderId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      })
      
      if (!detailsResponse.ok) {
        const errorText = await detailsResponse.text()
        return new Response(JSON.stringify({ error: 'Failed to get order details', details: errorText }), {
          status: detailsResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const details = await detailsResponse.json()
      return new Response(JSON.stringify({ order: details }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    default:
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
  }

  // Execute action on iFood API
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(endpoint, options)

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`iFood API error for ${action}:`, errorText)
    return new Response(JSON.stringify({ error: `iFood API error: ${action}`, details: errorText }), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Update order status locally
  const previousStatus = order.status
  
  await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', order.id)

  // Create status history
  await supabase
    .from('order_status_history')
    .insert({
      order_id: order.id,
      source: 'internal',
      from_status: previousStatus,
      to_status: newStatus,
      payload: { action, reason, code },
    })

  // Create order event
  await supabase
    .from('order_events')
    .insert({
      order_id: order.id,
      status: newStatus,
      message: `Ação executada: ${action}`,
      created_by: userId,
    })

  return new Response(JSON.stringify({ 
    success: true, 
    action, 
    newStatus,
    message: `Ação ${action} executada com sucesso` 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
