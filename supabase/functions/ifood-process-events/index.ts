import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const IFOOD_ORDER_URL = 'https://merchant-api.ifood.com.br/order/v1.0/orders'

// Map iFood event codes to internal order status
const STATUS_MAP: Record<string, string> = {
  'PLC': 'created',      // Placed
  'CFM': 'accepted',     // Confirmed
  'RTP': 'ready',        // Ready to pickup
  'DSP': 'out_for_delivery', // Dispatched
  'CON': 'delivered',    // Concluded/Delivered
  'CAN': 'canceled',     // Cancelled
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get unprocessed events
    const { data: events, error: eventsError } = await supabase
      .from('ifood_events')
      .select('*, ifood_connections(*)')
      .eq('processed', false)
      .order('created_at_event', { ascending: true })
      .limit(100)

    if (eventsError) {
      console.error('Failed to get events:', eventsError)
      return new Response(JSON.stringify({ error: 'Failed to get events' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: 'No events to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const results = []

    for (const event of events) {
      try {
        const connection = event.ifood_connections
        if (!connection || !connection.access_token) {
          console.error(`No connection or token for event ${event.id}`)
          continue
        }

        // Check if this is a new order event (PLC - Placed)
        if (event.code === 'PLC') {
          // Fetch full order details from iFood
          const orderResponse = await fetch(`${IFOOD_ORDER_URL}/${event.order_id}`, {
            headers: {
              'Authorization': `Bearer ${connection.access_token}`,
            },
          })

          if (!orderResponse.ok) {
            console.error(`Failed to get order ${event.order_id}:`, await orderResponse.text())
            continue
          }

          const orderData = await orderResponse.json()

          // Check if order already exists
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('external_order_id', event.order_id)
            .single()

          if (existingOrder) {
            // Order already exists, just mark event as processed
            await supabase
              .from('ifood_events')
              .update({ processed: true, processed_at: new Date().toISOString() })
              .eq('id', event.id)
            continue
          }

          // Calculate totals from iFood order
          const subtotal = orderData.total?.subTotal || orderData.orderAmount || 0
          const deliveryFee = orderData.total?.deliveryFee || 0
          const discount = orderData.total?.benefits || 0
          const total = orderData.total?.orderAmount || subtotal + deliveryFee - discount

          // Create new order in our system
          const { data: newOrder, error: orderError } = await supabase
            .from('orders')
            .insert({
              store_id: connection.store_id,
              user_id: connection.store_id, // Placeholder - iFood orders don't have internal user
              channel: 'ifood',
              external_order_id: event.order_id,
              merchant_id_ifood: event.merchant_id,
              raw_payload: orderData,
              status: 'created',
              delivery_type: orderData.orderType === 'DELIVERY' ? 'delivery' : 'pickup',
              subtotal: subtotal / 100, // iFood uses cents
              delivery_fee: deliveryFee / 100,
              discount: discount / 100,
              total: total / 100,
              payment_method: mapPaymentMethod(orderData.payments),
              payment_status: orderData.payments?.[0]?.prepaid ? 'paid' : 'pending',
              notes: orderData.additionalInfo || null,
              estimated_minutes: orderData.preparationStartDateTime ? 
                Math.round((new Date(orderData.preparationStartDateTime).getTime() - Date.now()) / 60000) : 
                40,
              address_snapshot: orderData.delivery?.deliveryAddress || null,
            })
            .select()
            .single()

          if (orderError) {
            console.error('Failed to create order:', orderError)
            continue
          }

          // Create order items
          if (orderData.items && Array.isArray(orderData.items)) {
            for (const item of orderData.items) {
              await supabase
                .from('order_items')
                .insert({
                  order_id: newOrder.id,
                  name_snapshot: item.name,
                  quantity: item.quantity,
                  base_price: (item.unitPrice || 0) / 100,
                  item_total: (item.totalPrice || 0) / 100,
                  options_snapshot: item.options || [],
                })
            }
          }

          // Create order event
          await supabase
            .from('order_events')
            .insert({
              order_id: newOrder.id,
              status: 'created',
              message: 'Pedido recebido via iFood',
            })

          // Create status history
          await supabase
            .from('order_status_history')
            .insert({
              order_id: newOrder.id,
              source: 'ifood',
              to_status: 'created',
              payload: event.payload,
            })

          // Create notification for admin
          const { data: admins } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin')

          if (admins) {
            for (const admin of admins) {
              await supabase
                .from('notifications')
                .insert({
                  user_id: admin.user_id,
                  type: 'order',
                  title: '🍕 Novo pedido iFood!',
                  body: `Pedido #${newOrder.order_number} - R$ ${(total / 100).toFixed(2)}`,
                  data: { orderId: newOrder.id, channel: 'ifood' },
                })
            }
          }

          results.push({ eventId: event.id, action: 'created_order', orderId: newOrder.id })

        } else {
          // Status update event
          const newStatus = STATUS_MAP[event.code]

          if (newStatus) {
            // Find existing order
            const { data: existingOrder } = await supabase
              .from('orders')
              .select('id, status')
              .eq('external_order_id', event.order_id)
              .single()

            if (existingOrder) {
              // Update order status
              await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', existingOrder.id)

              // Create status history
              await supabase
                .from('order_status_history')
                .insert({
                  order_id: existingOrder.id,
                  source: 'ifood',
                  from_status: existingOrder.status,
                  to_status: newStatus,
                  payload: event.payload,
                })

              // Create order event
              await supabase
                .from('order_events')
                .insert({
                  order_id: existingOrder.id,
                  status: newStatus,
                  message: `Status atualizado pelo iFood: ${event.code}`,
                })

              results.push({ eventId: event.id, action: 'updated_status', orderId: existingOrder.id, newStatus })
            }
          }
        }

        // Mark event as processed
        await supabase
          .from('ifood_events')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', event.id)

      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error)
        results.push({ eventId: event.id, action: 'error', error: String(error) })
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in ifood-process-events:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function mapPaymentMethod(payments: any[]): 'pix' | 'card' | 'cash' {
  if (!payments || payments.length === 0) return 'cash'
  
  const method = payments[0].method?.toLowerCase() || ''
  
  if (method.includes('pix')) return 'pix'
  if (method.includes('credit') || method.includes('debit') || method.includes('card')) return 'card'
  
  return 'cash'
}
