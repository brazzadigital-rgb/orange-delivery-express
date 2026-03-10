import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const IFOOD_EVENTS_URL = 'https://merchant-api.ifood.com.br/order/v1.0/events:polling'
const IFOOD_ACK_URL = 'https://merchant-api.ifood.com.br/order/v1.0/events/acknowledgment'

interface IFoodEvent {
  id: string
  code: string
  fullCode: string
  orderId: string
  merchantId: string
  createdAt: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body for connectionId or run all enabled connections
    let connectionId: string | null = null
    try {
      const body = await req.json()
      connectionId = body.connectionId
    } catch {
      // No body - will poll all enabled connections
    }

    // Get enabled connections
    let query = supabase
      .from('ifood_connections')
      .select('*')
      .eq('enabled', true)
      .eq('mode', 'POLLING')

    if (connectionId) {
      query = query.eq('id', connectionId)
    }

    const { data: connections, error: connError } = await query

    if (connError) {
      console.error('Failed to get connections:', connError)
      return new Response(JSON.stringify({ error: 'Failed to get connections' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ message: 'No enabled connections found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = []

    for (const connection of connections) {
      try {
        // Check if token is expired
        if (!connection.access_token || (connection.expires_at && new Date(connection.expires_at) < new Date())) {
          console.log(`Token expired for connection ${connection.id}, skipping`)
          results.push({ connectionId: connection.id, status: 'token_expired' })
          continue
        }

        // Poll for events
        const eventsResponse = await fetch(IFOOD_EVENTS_URL, {
          headers: {
            'Authorization': `Bearer ${connection.access_token}`,
          },
        })

        if (!eventsResponse.ok) {
          console.error(`Failed to poll events for ${connection.id}:`, await eventsResponse.text())
          results.push({ connectionId: connection.id, status: 'poll_failed', httpStatus: eventsResponse.status })
          continue
        }

        const events: IFoodEvent[] = await eventsResponse.json()

        if (!events || events.length === 0) {
          // Update last_poll_at even if no events
          await supabase
            .from('ifood_connections')
            .update({ last_poll_at: new Date().toISOString() })
            .eq('id', connection.id)

          results.push({ connectionId: connection.id, status: 'success', eventsCount: 0 })
          continue
        }

        // Sort events by createdAt (iFood docs say they may arrive out of order)
        events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

        const savedEventIds: string[] = []

        // Save events to database (idempotent via unique constraint)
        for (const event of events) {
          const { error: insertError } = await supabase
            .from('ifood_events')
            .upsert({
              connection_id: connection.id,
              event_id: event.id,
              code: event.code,
              full_code: event.fullCode,
              order_id: event.orderId,
              merchant_id: event.merchantId,
              created_at_event: event.createdAt,
              payload: event,
              processed: false,
            }, { onConflict: 'event_id', ignoreDuplicates: true })

          if (!insertError) {
            savedEventIds.push(event.id)
          }
        }

        // ACK events after persisting (critical for iFood)
        if (savedEventIds.length > 0) {
          const ackResponse = await fetch(IFOOD_ACK_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${connection.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(events.map(e => ({ id: e.id }))),
          })

          if (!ackResponse.ok) {
            console.error('Failed to ACK events:', await ackResponse.text())
          }
        }

        // Update last_poll_at
        await supabase
          .from('ifood_connections')
          .update({ last_poll_at: new Date().toISOString() })
          .eq('id', connection.id)

        results.push({ 
          connectionId: connection.id, 
          status: 'success', 
          eventsCount: events.length,
          savedCount: savedEventIds.length 
        })

      } catch (error) {
        console.error(`Error polling connection ${connection.id}:`, error)
        results.push({ connectionId: connection.id, status: 'error', error: String(error) })
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in ifood-poll:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
