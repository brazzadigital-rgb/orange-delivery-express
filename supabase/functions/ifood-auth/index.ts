import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const IFOOD_TOKEN_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token'

interface TokenResponse {
  accessToken: string
  type: string
  expiresIn: number
}

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

    // Verify admin role
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
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { connectionId, action } = await req.json()

    if (action === 'refresh') {
      // Get connection details
      const { data: connection, error: connError } = await supabase
        .from('ifood_connections')
        .select('*')
        .eq('id', connectionId)
        .single()

      if (connError || !connection) {
        return new Response(JSON.stringify({ error: 'Connection not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Request new token from iFood
      const formData = new URLSearchParams()
      formData.append('grantType', 'client_credentials')
      formData.append('clientId', connection.client_id)
      formData.append('clientSecret', connection.client_secret)

      const tokenResponse = await fetch(IFOOD_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('iFood token error:', errorText)
        return new Response(JSON.stringify({ error: 'Failed to authenticate with iFood', details: errorText }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const tokenData: TokenResponse = await tokenResponse.json()

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000)

      // Update connection with new token
      const { error: updateError } = await supabase
        .from('ifood_connections')
        .update({
          access_token: tokenData.accessToken,
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', connectionId)

      if (updateError) {
        console.error('Failed to update token:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to save token' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ 
        success: true, 
        expiresAt: expiresAt.toISOString() 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'test') {
      // Test connection with current token
      const { data: connection, error: connError } = await supabase
        .from('ifood_connections')
        .select('*')
        .eq('id', connectionId)
        .single()

      if (connError || !connection) {
        return new Response(JSON.stringify({ error: 'Connection not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!connection.access_token) {
        return new Response(JSON.stringify({ error: 'No access token. Please authenticate first.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Test by fetching merchants
      const merchantsResponse = await fetch('https://merchant-api.ifood.com.br/merchant/v1.0/merchants', {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
        },
      })

      if (!merchantsResponse.ok) {
        if (merchantsResponse.status === 401) {
          return new Response(JSON.stringify({ error: 'Token expired. Please refresh authentication.' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const errorText = await merchantsResponse.text()
        return new Response(JSON.stringify({ error: 'iFood API error', details: errorText }), {
          status: merchantsResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const merchants = await merchantsResponse.json()

      // Save merchants
      for (const merchant of merchants) {
        await supabase
          .from('ifood_merchants')
          .upsert({
            connection_id: connectionId,
            merchant_id: merchant.id,
            name: merchant.name,
            active: true,
          }, { onConflict: 'connection_id,merchant_id' })
      }

      return new Response(JSON.stringify({ 
        success: true, 
        merchants: merchants.length,
        merchantList: merchants 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in ifood-auth:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
