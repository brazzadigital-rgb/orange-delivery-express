export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          created_at: string
          id: string
          processed_at: string | null
          reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean | null
          label: string | null
          lat: number | null
          lng: number | null
          neighborhood: string
          number: string
          state: string
          street: string
          user_id: string
          zip: string
        }
        Insert: {
          city: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          lng?: number | null
          neighborhood: string
          number: string
          state: string
          street: string
          user_id: string
          zip: string
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          lng?: number | null
          neighborhood?: string
          number?: string
          state?: string
          street?: string
          user_id?: string
          zip?: string
        }
        Relationships: []
      }
      app_reviews: {
        Row: {
          admin_reply: string | null
          app_version: string | null
          comment: string | null
          contact_allowed: boolean | null
          created_at: string
          id: string
          is_public: boolean | null
          order_id: string | null
          platform: string | null
          rating: number
          store_id: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          app_version?: string | null
          comment?: string | null
          contact_allowed?: boolean | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          order_id?: string | null
          platform?: string | null
          rating: number
          store_id: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          app_version?: string | null
          comment?: string | null
          contact_allowed?: boolean | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          order_id?: string | null
          platform?: string | null
          rating?: number
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          app_description: string | null
          app_icon_192_url: string | null
          app_icon_512_url: string | null
          app_icon_maskable_url: string | null
          app_logo_url: string | null
          app_name: string
          app_short_name: string
          background_color: string | null
          brand_accent: string | null
          brand_background: string | null
          brand_primary: string | null
          brand_secondary: string | null
          brand_surface: string | null
          brand_text: string | null
          created_at: string
          enable_install_banner: boolean | null
          enable_maintenance_mode: boolean | null
          enable_offline_catalog: boolean | null
          enable_push_notifications: boolean | null
          gradient_end: string | null
          gradient_start: string | null
          id: string
          maintenance_message: string | null
          offline_message: string | null
          privacy_url: string | null
          splash_image_url: string | null
          store_id: string
          support_email: string | null
          support_whatsapp: string | null
          terms_url: string | null
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          app_description?: string | null
          app_icon_192_url?: string | null
          app_icon_512_url?: string | null
          app_icon_maskable_url?: string | null
          app_logo_url?: string | null
          app_name?: string
          app_short_name?: string
          background_color?: string | null
          brand_accent?: string | null
          brand_background?: string | null
          brand_primary?: string | null
          brand_secondary?: string | null
          brand_surface?: string | null
          brand_text?: string | null
          created_at?: string
          enable_install_banner?: boolean | null
          enable_maintenance_mode?: boolean | null
          enable_offline_catalog?: boolean | null
          enable_push_notifications?: boolean | null
          gradient_end?: string | null
          gradient_start?: string | null
          id?: string
          maintenance_message?: string | null
          offline_message?: string | null
          privacy_url?: string | null
          splash_image_url?: string | null
          store_id: string
          support_email?: string | null
          support_whatsapp?: string | null
          terms_url?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          app_description?: string | null
          app_icon_192_url?: string | null
          app_icon_512_url?: string | null
          app_icon_maskable_url?: string | null
          app_logo_url?: string | null
          app_name?: string
          app_short_name?: string
          background_color?: string | null
          brand_accent?: string | null
          brand_background?: string | null
          brand_primary?: string | null
          brand_secondary?: string | null
          brand_surface?: string | null
          brand_text?: string | null
          created_at?: string
          enable_install_banner?: boolean | null
          enable_maintenance_mode?: boolean | null
          enable_offline_catalog?: boolean | null
          enable_push_notifications?: boolean | null
          gradient_end?: string | null
          gradient_start?: string | null
          id?: string
          maintenance_message?: string | null
          offline_message?: string | null
          privacy_url?: string | null
          splash_image_url?: string | null
          store_id?: string
          support_email?: string | null
          support_whatsapp?: string | null
          terms_url?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          active: boolean | null
          created_at: string
          ends_at: string | null
          id: string
          image_url: string
          link_type: string | null
          link_value: string | null
          sort_order: number | null
          starts_at: string | null
          store_id: string
          subtitle: string | null
          title: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url: string
          link_type?: string | null
          link_value?: string | null
          sort_order?: number | null
          starts_at?: string | null
          store_id: string
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string
          link_type?: string | null
          link_value?: string | null
          sort_order?: number | null
          starts_at?: string | null
          store_id?: string
          subtitle?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          gateway_payment_id: string | null
          id: string
          method: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          store_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          gateway_payment_id?: string | null
          id?: string
          method?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          store_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          gateway_payment_id?: string | null
          id?: string
          method?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          annual_price: number | null
          code: string
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_admins: number | null
          max_drivers: number | null
          max_orders_month: number | null
          max_products: number | null
          monthly_price: number | null
          name: string
          sort_order: number | null
        }
        Insert: {
          annual_price?: number | null
          code: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_admins?: number | null
          max_drivers?: number | null
          max_orders_month?: number | null
          max_products?: number | null
          monthly_price?: number | null
          name: string
          sort_order?: number | null
        }
        Update: {
          annual_price?: number | null
          code?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_admins?: number | null
          max_drivers?: number | null
          max_orders_month?: number | null
          max_products?: number | null
          monthly_price?: number | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      billing_settings: {
        Row: {
          created_at: string
          currency: string | null
          current_plan_amount: number | null
          current_plan_code: string | null
          current_plan_discount_percent: number | null
          current_plan_months: number | null
          features_json: Json | null
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          grace_period_days: number | null
          id: string
          last_mp_status: string | null
          last_payment_amount: number | null
          last_payment_date: string | null
          max_admins: number | null
          max_drivers: number | null
          max_orders_month: number | null
          max_products: number | null
          monthly_price: number | null
          mp_init_point: string | null
          mp_payer_email: string | null
          mp_preapproval_id: string | null
          next_billing_at: string | null
          next_due_date: string | null
          payment_method: string | null
          plan_name: string | null
          status: string | null
          store_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          current_plan_amount?: number | null
          current_plan_code?: string | null
          current_plan_discount_percent?: number | null
          current_plan_months?: number | null
          features_json?: Json | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          grace_period_days?: number | null
          id?: string
          last_mp_status?: string | null
          last_payment_amount?: number | null
          last_payment_date?: string | null
          max_admins?: number | null
          max_drivers?: number | null
          max_orders_month?: number | null
          max_products?: number | null
          monthly_price?: number | null
          mp_init_point?: string | null
          mp_payer_email?: string | null
          mp_preapproval_id?: string | null
          next_billing_at?: string | null
          next_due_date?: string | null
          payment_method?: string | null
          plan_name?: string | null
          status?: string | null
          store_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          current_plan_amount?: number | null
          current_plan_code?: string | null
          current_plan_discount_percent?: number | null
          current_plan_months?: number | null
          features_json?: Json | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          grace_period_days?: number | null
          id?: string
          last_mp_status?: string | null
          last_payment_amount?: number | null
          last_payment_date?: string | null
          max_admins?: number | null
          max_drivers?: number | null
          max_orders_month?: number | null
          max_products?: number | null
          monthly_price?: number | null
          mp_init_point?: string | null
          mp_payer_email?: string | null
          mp_preapproval_id?: string | null
          next_billing_at?: string | null
          next_due_date?: string | null
          payment_method?: string | null
          plan_name?: string | null
          status?: string | null
          store_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          base_price: number
          cart_id: string
          created_at: string
          id: string
          item_total: number
          name_snapshot: string
          options_snapshot: Json | null
          product_id: string
          quantity: number
        }
        Insert: {
          base_price: number
          cart_id: string
          created_at?: string
          id?: string
          item_total: number
          name_snapshot: string
          options_snapshot?: Json | null
          product_id: string
          quantity?: number
        }
        Update: {
          base_price?: number
          cart_id?: string
          created_at?: string
          id?: string
          item_total?: number
          name_snapshot?: string
          options_snapshot?: Json | null
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          coupon_code: string | null
          created_at: string
          delivery_fee: number
          discount: number
          id: string
          status: string
          store_id: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          delivery_fee?: number
          discount?: number
          id?: string
          status?: string
          store_id: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          delivery_fee?: number
          discount?: number
          id?: string
          status?: string
          store_id?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string
          icon: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number | null
          store_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number | null
          store_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean | null
          amount: number
          code: string
          created_at: string
          ends_at: string | null
          id: string
          max_uses: number | null
          min_value: number | null
          starts_at: string | null
          store_id: string
          type: Database["public"]["Enums"]["coupon_type"]
          used_count: number | null
        }
        Insert: {
          active?: boolean | null
          amount: number
          code: string
          created_at?: string
          ends_at?: string | null
          id?: string
          max_uses?: number | null
          min_value?: number | null
          starts_at?: string | null
          store_id: string
          type: Database["public"]["Enums"]["coupon_type"]
          used_count?: number | null
        }
        Update: {
          active?: boolean | null
          amount?: number
          code?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          max_uses?: number | null
          min_value?: number | null
          starts_at?: string | null
          store_id?: string
          type?: Database["public"]["Enums"]["coupon_type"]
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          active: boolean | null
          center_lat: number | null
          center_lng: number | null
          created_at: string
          estimated_minutes: number | null
          fee: number
          id: string
          max_distance: number
          max_fee: number | null
          min_distance: number | null
          min_order_value: number | null
          mode: string | null
          name: string
          per_km_fee: number | null
          polygon_geojson: Json | null
          radius_km: number | null
          sort_order: number | null
          store_id: string
        }
        Insert: {
          active?: boolean | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          estimated_minutes?: number | null
          fee: number
          id?: string
          max_distance: number
          max_fee?: number | null
          min_distance?: number | null
          min_order_value?: number | null
          mode?: string | null
          name: string
          per_km_fee?: number | null
          polygon_geojson?: Json | null
          radius_km?: number | null
          sort_order?: number | null
          store_id: string
        }
        Update: {
          active?: boolean | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          estimated_minutes?: number | null
          fee?: number
          id?: string
          max_distance?: number
          max_fee?: number | null
          min_distance?: number | null
          min_order_value?: number | null
          mode?: string | null
          name?: string
          per_km_fee?: number | null
          polygon_geojson?: Json | null
          radius_km?: number | null
          sort_order?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          driver_id: string
          heading: number | null
          id: string
          lat: number
          lng: number
          order_id: string
          recorded_at: string
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          driver_id: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          order_id: string
          recorded_at?: string
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          driver_id?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          order_id?: string
          recorded_at?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ifood_connections: {
        Row: {
          access_token: string | null
          client_id: string
          client_secret: string
          created_at: string
          enabled: boolean
          expires_at: string | null
          id: string
          last_poll_at: string | null
          mode: string
          refresh_token: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          client_id: string
          client_secret: string
          created_at?: string
          enabled?: boolean
          expires_at?: string | null
          id?: string
          last_poll_at?: string | null
          mode?: string
          refresh_token?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          client_id?: string
          client_secret?: string
          created_at?: string
          enabled?: boolean
          expires_at?: string | null
          id?: string
          last_poll_at?: string | null
          mode?: string
          refresh_token?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ifood_connections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ifood_events: {
        Row: {
          code: string
          connection_id: string
          created_at: string
          created_at_event: string
          event_id: string
          full_code: string | null
          id: string
          merchant_id: string | null
          order_id: string | null
          payload: Json
          processed: boolean
          processed_at: string | null
        }
        Insert: {
          code: string
          connection_id: string
          created_at?: string
          created_at_event: string
          event_id: string
          full_code?: string | null
          id?: string
          merchant_id?: string | null
          order_id?: string | null
          payload?: Json
          processed?: boolean
          processed_at?: string | null
        }
        Update: {
          code?: string
          connection_id?: string
          created_at?: string
          created_at_event?: string
          event_id?: string
          full_code?: string | null
          id?: string
          merchant_id?: string | null
          order_id?: string | null
          payload?: Json
          processed?: boolean
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ifood_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ifood_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      ifood_merchants: {
        Row: {
          active: boolean
          connection_id: string
          created_at: string
          id: string
          merchant_id: string
          name: string | null
        }
        Insert: {
          active?: boolean
          connection_id: string
          created_at?: string
          id?: string
          merchant_id: string
          name?: string | null
        }
        Update: {
          active?: boolean
          connection_id?: string
          created_at?: string
          id?: string
          merchant_id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ifood_merchants_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ifood_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_redemptions: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          points_spent: number
          reward_id: string | null
          status: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          points_spent?: number
          reward_id?: string | null
          status?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          points_spent?: number
          reward_id?: string | null
          status?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_redemptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          active: boolean | null
          constraints: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          points_cost: number
          sort_order: number | null
          store_id: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          constraints?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          points_cost?: number
          sort_order?: number | null
          store_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          constraints?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          points_cost?: number
          sort_order?: number | null
          store_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          meta: Json | null
          order_id: string | null
          points: number
          store_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          meta?: Json | null
          order_id?: string | null
          points: number
          store_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          meta?: Json | null
          order_id?: string | null
          points?: number
          store_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_wallets: {
        Row: {
          created_at: string
          id: string
          lifetime_earned: number
          lifetime_spent: number
          points_balance: number
          points_pending: number
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          points_balance?: number
          points_pending?: number
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lifetime_earned?: number
          lifetime_spent?: number
          points_balance?: number
          points_pending?: number
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_wallets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      merged_tables: {
        Row: {
          created_at: string
          id: string
          master_session_id: string
          merged_from_session_id: string | null
          status: string
          table_id: string
          table_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          master_session_id: string
          merged_from_session_id?: string | null
          status?: string
          table_id: string
          table_number: number
        }
        Update: {
          created_at?: string
          id?: string
          master_session_id?: string
          merged_from_session_id?: string | null
          status?: string
          table_id?: string
          table_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "merged_tables_master_session_id_fkey"
            columns: ["master_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merged_tables_merged_from_session_id_fkey"
            columns: ["merged_from_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merged_tables_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          loyalty: boolean | null
          order_updates: boolean | null
          promotions: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          loyalty?: boolean | null
          order_updates?: boolean | null
          promotions?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          loyalty?: boolean | null
          order_updates?: boolean | null
          promotions?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      order_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          base_price: number
          created_at: string
          id: string
          item_total: number
          name_snapshot: string
          options_snapshot: Json | null
          order_id: string
          product_id: string | null
          quantity: number
        }
        Insert: {
          base_price: number
          created_at?: string
          id?: string
          item_total: number
          name_snapshot: string
          options_snapshot?: Json | null
          order_id: string
          product_id?: string | null
          quantity?: number
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: string
          item_total?: number
          name_snapshot?: string
          options_snapshot?: Json | null
          order_id?: string
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_print_jobs: {
        Row: {
          copies: number
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          is_reprint: boolean
          order_id: string
          printed_at: string | null
          status: string
          store_id: string
          template: string
        }
        Insert: {
          copies?: number
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          is_reprint?: boolean
          order_id: string
          printed_at?: string | null
          status?: string
          store_id: string
          template: string
        }
        Update: {
          copies?: number
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          is_reprint?: boolean
          order_id?: string
          printed_at?: string | null
          status?: string
          store_id?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_print_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_print_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_print_jobs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          from_status: string | null
          id: string
          order_id: string
          payload: Json | null
          source: string
          to_status: string
        }
        Insert: {
          created_at?: string
          from_status?: string | null
          id?: string
          order_id: string
          payload?: Json | null
          source?: string
          to_status: string
        }
        Update: {
          created_at?: string
          from_status?: string | null
          id?: string
          order_id?: string
          payload?: Json | null
          source?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          address_snapshot: Json | null
          cancel_reason: string | null
          cash_change_amount: number | null
          cash_change_for: number | null
          cash_change_needed: boolean | null
          channel: string
          coupon_id: string | null
          created_at: string
          delivery_fee: number | null
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          discount: number | null
          driver_id: string | null
          estimated_minutes: number | null
          external_order_id: string | null
          id: string
          loyalty_earn_processed: boolean
          loyalty_points_earned: number
          loyalty_points_spent: number
          loyalty_reward_applied: Json | null
          loyalty_spend_processed: boolean
          merchant_id_ifood: string | null
          notes: string | null
          order_number: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          raw_payload: Json | null
          reject_reason: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_id?: string | null
          address_snapshot?: Json | null
          cancel_reason?: string | null
          cash_change_amount?: number | null
          cash_change_for?: number | null
          cash_change_needed?: boolean | null
          channel?: string
          coupon_id?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          discount?: number | null
          driver_id?: string | null
          estimated_minutes?: number | null
          external_order_id?: string | null
          id?: string
          loyalty_earn_processed?: boolean
          loyalty_points_earned?: number
          loyalty_points_spent?: number
          loyalty_reward_applied?: Json | null
          loyalty_spend_processed?: boolean
          merchant_id_ifood?: string | null
          notes?: string | null
          order_number?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          raw_payload?: Json | null
          reject_reason?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_id?: string | null
          address_snapshot?: Json | null
          cancel_reason?: string | null
          cash_change_amount?: number | null
          cash_change_for?: number | null
          cash_change_needed?: boolean | null
          channel?: string
          coupon_id?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          discount?: number | null
          driver_id?: string | null
          estimated_minutes?: number | null
          external_order_id?: string | null
          id?: string
          loyalty_earn_processed?: boolean
          loyalty_points_earned?: number
          loyalty_points_spent?: number
          loyalty_reward_applied?: Json | null
          loyalty_spend_processed?: boolean
          merchant_id_ifood?: string | null
          notes?: string | null
          order_number?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          raw_payload?: Json | null
          reject_reason?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount: number
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          method: string
          order_id: string
          payload: Json | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          method: string
          order_id: string
          payload?: Json | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          method?: string
          order_id?: string
          payload?: Json | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_intents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      pizza_addon_groups: {
        Row: {
          active: boolean | null
          created_at: string
          group_type: string
          id: string
          max_select: number | null
          min_select: number | null
          name: string
          sort_order: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          group_type?: string
          id?: string
          max_select?: number | null
          min_select?: number | null
          name: string
          sort_order?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          group_type?: string
          id?: string
          max_select?: number | null
          min_select?: number | null
          name?: string
          sort_order?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizza_addon_groups_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      pizza_addons: {
        Row: {
          active: boolean | null
          created_at: string
          group_id: string
          id: string
          name: string
          price: number
          sort_order: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          group_id: string
          id?: string
          name: string
          price?: number
          sort_order?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          group_id?: string
          id?: string
          name?: string
          price?: number
          sort_order?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizza_addons_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "pizza_addon_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_addons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      pizza_flavor_prices: {
        Row: {
          created_at: string
          flavor_id: string
          id: string
          price: number
          size_id: string
          store_id: string
        }
        Insert: {
          created_at?: string
          flavor_id: string
          id?: string
          price?: number
          size_id: string
          store_id: string
        }
        Update: {
          created_at?: string
          flavor_id?: string
          id?: string
          price?: number
          size_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizza_flavor_prices_flavor_id_fkey"
            columns: ["flavor_id"]
            isOneToOne: false
            referencedRelation: "pizza_flavors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_flavor_prices_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "pizza_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pizza_flavor_prices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      pizza_flavors: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          sort_order: number | null
          store_id: string
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          sort_order?: number | null
          store_id: string
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sort_order?: number | null
          store_id?: string
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizza_flavors_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      pizza_sizes: {
        Row: {
          active: boolean | null
          base_price: number
          created_at: string
          description: string | null
          id: string
          is_promo: boolean | null
          max_flavors: number
          name: string
          promo_label: string | null
          slices: number
          sort_order: number | null
          store_id: string
          unit_label: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_promo?: boolean | null
          max_flavors?: number
          name: string
          promo_label?: string | null
          slices: number
          sort_order?: number | null
          store_id: string
          unit_label?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          base_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_promo?: boolean | null
          max_flavors?: number
          name?: string
          promo_label?: string | null
          slices?: number
          sort_order?: number | null
          store_id?: string
          unit_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pizza_sizes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_items: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          is_default: boolean | null
          label: string
          option_id: string
          price_delta: number | null
          sort_order: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          label: string
          option_id: string
          price_delta?: number | null
          sort_order?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          label?: string
          option_id?: string
          price_delta?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_option_items_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string
          id: string
          max_select: number | null
          name: string
          product_id: string
          required: boolean | null
          sort_order: number | null
          type: Database["public"]["Enums"]["option_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          max_select?: number | null
          name: string
          product_id: string
          required?: boolean | null
          sort_order?: number | null
          type: Database["public"]["Enums"]["option_type"]
        }
        Update: {
          created_at?: string
          id?: string
          max_select?: number | null
          name?: string
          product_id?: string
          required?: boolean | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["option_type"]
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          base_price: number
          category_id: string
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          image_url: string | null
          name: string
          promo_price: number | null
          rating_avg: number | null
          rating_count: number | null
          store_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          base_price: number
          category_id: string
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name: string
          promo_price?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          store_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          base_price?: number
          category_id?: string
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          name?: string
          promo_price?: number | null
          rating_avg?: number | null
          rating_count?: number | null
          store_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean | null
          banner_url: string | null
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number | null
          ends_at: string | null
          id: string
          starts_at: string | null
          store_id: string
          target_audience: string | null
          title: string
        }
        Insert: {
          active?: boolean | null
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          store_id: string
          target_audience?: string | null
          title: string
        }
        Update: {
          active?: boolean | null
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number | null
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          store_id?: string
          target_audience?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      push_delivery_logs: {
        Row: {
          created_at: string
          endpoint_hash: string
          error_message: string | null
          http_status: number | null
          id: string
          payload: Json | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint_hash: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          payload?: Json | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint_hash?: string
          error_message?: string | null
          http_status?: number | null
          id?: string
          payload?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_delivery_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          keys: Json
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          keys: Json
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          keys?: Json
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          active: boolean | null
          area: string | null
          capacity: number | null
          created_at: string
          id: string
          is_active: boolean | null
          label: string | null
          name: string | null
          number: number
          qr_token: string | null
          status: string
          store_id: string
        }
        Insert: {
          active?: boolean | null
          area?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          label?: string | null
          name?: string | null
          number: number
          qr_token?: string | null
          status?: string
          store_id: string
        }
        Update: {
          active?: boolean | null
          area?: string | null
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          label?: string | null
          name?: string | null
          number?: number
          qr_token?: string | null
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string | null
          rating: number
          store_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          rating: number
          store_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          rating?: number
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_app_review_settings: {
        Row: {
          app_store_url: string | null
          ask_after_orders: number | null
          created_at: string
          enabled: boolean | null
          id: string
          min_days_between_reviews: number | null
          min_rating_for_store: number | null
          play_store_url: string | null
          prompt_message: string | null
          review_prompt_subtitle: string | null
          review_prompt_title: string | null
          store_id: string
          thank_you_message: string | null
          updated_at: string
        }
        Insert: {
          app_store_url?: string | null
          ask_after_orders?: number | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          min_days_between_reviews?: number | null
          min_rating_for_store?: number | null
          play_store_url?: string | null
          prompt_message?: string | null
          review_prompt_subtitle?: string | null
          review_prompt_title?: string | null
          store_id: string
          thank_you_message?: string | null
          updated_at?: string
        }
        Update: {
          app_store_url?: string | null
          ask_after_orders?: number | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          min_days_between_reviews?: number | null
          min_rating_for_store?: number | null
          play_store_url?: string | null
          prompt_message?: string | null
          review_prompt_subtitle?: string | null
          review_prompt_title?: string | null
          store_id?: string
          thank_you_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_app_review_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_features: {
        Row: {
          created_at: string
          features: Json
          id: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_features_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_home_sections: {
        Row: {
          config: Json | null
          created_at: string
          enabled: boolean | null
          id: string
          label: string
          section_key: string
          sort_order: number | null
          store_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          label: string
          section_key: string
          sort_order?: number | null
          store_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          label?: string
          section_key?: string
          sort_order?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_home_sections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_loyalty_settings: {
        Row: {
          allow_partial_redeem_shipping: boolean | null
          auto_credit: boolean | null
          auto_credit_enabled: boolean | null
          created_at: string
          credit_on_status: string | null
          earning_rate_points_per_real: number | null
          enabled: boolean
          expiry_days: number | null
          id: string
          max_discount_pct: number | null
          max_points_per_order: number | null
          max_points_redeem_per_order: number | null
          min_order_to_earn: number | null
          points_expire_days: number | null
          program_name: string | null
          reais_per_point: number | null
          store_id: string
          updated_at: string
          welcome_bonus: number | null
        }
        Insert: {
          allow_partial_redeem_shipping?: boolean | null
          auto_credit?: boolean | null
          auto_credit_enabled?: boolean | null
          created_at?: string
          credit_on_status?: string | null
          earning_rate_points_per_real?: number | null
          enabled?: boolean
          expiry_days?: number | null
          id?: string
          max_discount_pct?: number | null
          max_points_per_order?: number | null
          max_points_redeem_per_order?: number | null
          min_order_to_earn?: number | null
          points_expire_days?: number | null
          program_name?: string | null
          reais_per_point?: number | null
          store_id: string
          updated_at?: string
          welcome_bonus?: number | null
        }
        Update: {
          allow_partial_redeem_shipping?: boolean | null
          auto_credit?: boolean | null
          auto_credit_enabled?: boolean | null
          created_at?: string
          credit_on_status?: string | null
          earning_rate_points_per_real?: number | null
          enabled?: boolean
          expiry_days?: number | null
          id?: string
          max_discount_pct?: number | null
          max_points_per_order?: number | null
          max_points_redeem_per_order?: number | null
          min_order_to_earn?: number | null
          points_expire_days?: number | null
          program_name?: string | null
          reais_per_point?: number | null
          store_id?: string
          updated_at?: string
          welcome_bonus?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "store_loyalty_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_pizza_settings: {
        Row: {
          allow_less_than_max: boolean | null
          created_at: string
          max_observation_chars: number | null
          pricing_mode: string
          pricing_rule: string
          require_at_least_one_flavor: boolean | null
          store_id: string
          updated_at: string
        }
        Insert: {
          allow_less_than_max?: boolean | null
          created_at?: string
          max_observation_chars?: number | null
          pricing_mode?: string
          pricing_rule?: string
          require_at_least_one_flavor?: boolean | null
          store_id: string
          updated_at?: string
        }
        Update: {
          allow_less_than_max?: boolean | null
          created_at?: string
          max_observation_chars?: number | null
          pricing_mode?: string
          pricing_rule?: string
          require_at_least_one_flavor?: boolean | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_pizza_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_print_settings: {
        Row: {
          auto_print_copies: number
          auto_print_new_orders: boolean
          created_at: string
          footer_message: string | null
          header_logo_url: string | null
          id: string
          paper_size: string
          print_on_status: string
          print_templates_enabled: Json
          printer_enabled: boolean
          show_prices_on_kitchen: boolean
          show_qr_pickup: boolean
          store_id: string
          updated_at: string
        }
        Insert: {
          auto_print_copies?: number
          auto_print_new_orders?: boolean
          created_at?: string
          footer_message?: string | null
          header_logo_url?: string | null
          id?: string
          paper_size?: string
          print_on_status?: string
          print_templates_enabled?: Json
          printer_enabled?: boolean
          show_prices_on_kitchen?: boolean
          show_qr_pickup?: boolean
          store_id: string
          updated_at?: string
        }
        Update: {
          auto_print_copies?: number
          auto_print_new_orders?: boolean
          created_at?: string
          footer_message?: string | null
          header_logo_url?: string | null
          id?: string
          paper_size?: string
          print_on_status?: string
          print_templates_enabled?: Json
          printer_enabled?: boolean
          show_prices_on_kitchen?: boolean
          show_qr_pickup?: boolean
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_print_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          auto_open_close_enabled: boolean
          closed_message: string | null
          created_at: string
          delivery_enabled: boolean
          id: string
          is_open_override: boolean | null
          min_order_value: number | null
          opening_hours: Json
          payment_card_enabled: boolean
          payment_cash_enabled: boolean
          payment_pix_enabled: boolean
          pickup_enabled: boolean
          require_table_pin: boolean | null
          scheduled_delivery_enabled: boolean | null
          sla_accept_minutes: number | null
          sla_delivery_minutes: number | null
          sla_prepare_minutes: number | null
          store_address: string | null
          store_id: string
          store_lat: number | null
          store_lng: number | null
          store_name: string
          store_phone: string | null
          timezone: string
          token_expiration_minutes: number | null
          updated_at: string
        }
        Insert: {
          auto_open_close_enabled?: boolean
          closed_message?: string | null
          created_at?: string
          delivery_enabled?: boolean
          id?: string
          is_open_override?: boolean | null
          min_order_value?: number | null
          opening_hours?: Json
          payment_card_enabled?: boolean
          payment_cash_enabled?: boolean
          payment_pix_enabled?: boolean
          pickup_enabled?: boolean
          require_table_pin?: boolean | null
          scheduled_delivery_enabled?: boolean | null
          sla_accept_minutes?: number | null
          sla_delivery_minutes?: number | null
          sla_prepare_minutes?: number | null
          store_address?: string | null
          store_id: string
          store_lat?: number | null
          store_lng?: number | null
          store_name?: string
          store_phone?: string | null
          timezone?: string
          token_expiration_minutes?: number | null
          updated_at?: string
        }
        Update: {
          auto_open_close_enabled?: boolean
          closed_message?: string | null
          created_at?: string
          delivery_enabled?: boolean
          id?: string
          is_open_override?: boolean | null
          min_order_value?: number | null
          opening_hours?: Json
          payment_card_enabled?: boolean
          payment_cash_enabled?: boolean
          payment_pix_enabled?: boolean
          pickup_enabled?: boolean
          require_table_pin?: boolean | null
          scheduled_delivery_enabled?: boolean | null
          sla_accept_minutes?: number | null
          sla_delivery_minutes?: number | null
          sla_prepare_minutes?: number | null
          store_address?: string | null
          store_id?: string
          store_lat?: number | null
          store_lng?: number | null
          store_name?: string
          store_phone?: string | null
          timezone?: string
          token_expiration_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_users: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["store_role"]
          store_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["store_role"]
          store_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["store_role"]
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_users_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_users_store_id_stores_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_users_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address_text: string | null
          created_at: string
          created_by: string | null
          custom_domain: string | null
          id: string
          is_open: boolean | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          min_order_value: number | null
          name: string
          opening_hours: Json | null
          owner_email: string | null
          phone: string | null
          plan: string | null
          primary_color: string | null
          slug: string | null
          status: string | null
          store_type: string | null
          updated_at: string
        }
        Insert: {
          address_text?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          id?: string
          is_open?: boolean | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          min_order_value?: number | null
          name: string
          opening_hours?: Json | null
          owner_email?: string | null
          phone?: string | null
          plan?: string | null
          primary_color?: string | null
          slug?: string | null
          status?: string | null
          store_type?: string | null
          updated_at?: string
        }
        Update: {
          address_text?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          id?: string
          is_open?: boolean | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          min_order_value?: number | null
          name?: string
          opening_hours?: Json | null
          owner_email?: string | null
          phone?: string | null
          plan?: string | null
          primary_color?: string | null
          slug?: string | null
          status?: string | null
          store_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          gateway_payment_id: string | null
          id: string
          method: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          store_id: string
          subscription_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          gateway_payment_id?: string | null
          id?: string
          method?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          store_id: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          gateway_payment_id?: string | null
          id?: string
          method?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          store_id?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_per_cycle: number | null
          base_monthly_price: number | null
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          discount_percent: number | null
          final_monthly_price: number | null
          gateway: string | null
          gateway_customer_id: string | null
          gateway_subscription_id: string | null
          grace_period_days: number | null
          id: string
          last_mp_status: string | null
          last_payment_amount: number | null
          last_payment_at: string | null
          mp_init_point: string | null
          mp_payer_email: string | null
          mp_preapproval_id: string | null
          next_due_date: string | null
          plan_code: string
          plan_months: number | null
          status: string
          store_id: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_per_cycle?: number | null
          base_monthly_price?: number | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          discount_percent?: number | null
          final_monthly_price?: number | null
          gateway?: string | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          grace_period_days?: number | null
          id?: string
          last_mp_status?: string | null
          last_payment_amount?: number | null
          last_payment_at?: string | null
          mp_init_point?: string | null
          mp_payer_email?: string | null
          mp_preapproval_id?: string | null
          next_due_date?: string | null
          plan_code?: string
          plan_months?: number | null
          status?: string
          store_id: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_per_cycle?: number | null
          base_monthly_price?: number | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          discount_percent?: number | null
          final_monthly_price?: number | null
          gateway?: string | null
          gateway_customer_id?: string | null
          gateway_subscription_id?: string | null
          grace_period_days?: number | null
          id?: string
          last_mp_status?: string | null
          last_payment_amount?: number | null
          last_payment_at?: string | null
          mp_init_point?: string | null
          mp_payer_email?: string | null
          mp_preapproval_id?: string | null
          next_due_date?: string | null
          plan_code?: string
          plan_months?: number | null
          status?: string
          store_id?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      table_calls: {
        Row: {
          answered_at: string | null
          answered_by: string | null
          attended_at: string | null
          attended_by_user_id: string | null
          created_at: string
          id: string
          message: string | null
          session_id: string | null
          status: string
          store_id: string
          table_id: string
          table_number: number | null
          table_session_id: string | null
          type: string
        }
        Insert: {
          answered_at?: string | null
          answered_by?: string | null
          attended_at?: string | null
          attended_by_user_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          session_id?: string | null
          status?: string
          store_id: string
          table_id: string
          table_number?: number | null
          table_session_id?: string | null
          type?: string
        }
        Update: {
          answered_at?: string | null
          answered_by?: string | null
          attended_at?: string | null
          attended_by_user_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          session_id?: string | null
          status?: string
          store_id?: string
          table_id?: string
          table_number?: number | null
          table_session_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_calls_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_calls_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_calls_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_calls_table_session_id_fkey"
            columns: ["table_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_session_items: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          item_total: number
          name_snapshot: string
          options_snapshot: Json | null
          product_id: string | null
          quantity: number
          session_id: string
          status: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_total: number
          name_snapshot: string
          options_snapshot?: Json | null
          product_id?: string | null
          quantity?: number
          session_id: string
          status?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_total?: number
          name_snapshot?: string
          options_snapshot?: Json | null
          product_id?: string | null
          quantity?: number
          session_id?: string
          status?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "table_session_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_session_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          last_call_at: string | null
          notes: string | null
          opened_at: string
          opened_by: string | null
          opened_by_waiter_id: string | null
          push_subscription: Json | null
          status: string
          store_id: string
          table_id: string
          total: number | null
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          last_call_at?: string | null
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opened_by_waiter_id?: string | null
          push_subscription?: Json | null
          status?: string
          store_id: string
          table_id: string
          total?: number | null
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          last_call_at?: string | null
          notes?: string | null
          opened_at?: string
          opened_by?: string | null
          opened_by_waiter_id?: string | null
          push_subscription?: Json | null
          status?: string
          store_id?: string
          table_id?: string
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          created_at: string
          id: string
          last_sound_unlocked_at: string | null
          order_sound_enabled: boolean
          order_sound_type: string
          order_sound_volume: number
          push_enabled: boolean
          updated_at: string
          user_id: string
          vibration_enabled: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          last_sound_unlocked_at?: string | null
          order_sound_enabled?: boolean
          order_sound_type?: string
          order_sound_volume?: number
          push_enabled?: boolean
          updated_at?: string
          user_id: string
          vibration_enabled?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          last_sound_unlocked_at?: string | null
          order_sound_enabled?: boolean
          order_sound_type?: string
          order_sound_volume?: number
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
          vibration_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_privacy_settings: {
        Row: {
          allow_promotional_contact: boolean | null
          created_at: string
          id: string
          share_location_during_delivery: boolean | null
          show_name_to_store: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_promotional_contact?: boolean | null
          created_at?: string
          id?: string
          share_location_during_delivery?: boolean | null
          show_name_to_store?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_promotional_contact?: boolean | null
          created_at?: string
          id?: string
          share_location_during_delivery?: boolean | null
          show_name_to_store?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waiter_assignments: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          session_id: string | null
          store_id: string
          table_id: string
          waiter_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          session_id?: string | null
          store_id: string
          table_id: string
          waiter_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          session_id?: string | null
          store_id?: string
          table_id?: string
          waiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiter_assignments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiter_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiter_assignments_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiter_assignments_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "waiters"
            referencedColumns: ["id"]
          },
        ]
      }
      waiters: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string | null
          store_id: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string | null
          store_id: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string | null
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiters_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      driver_locations_latest: {
        Row: {
          accuracy: number | null
          driver_id: string | null
          heading: number | null
          id: string | null
          lat: number | null
          lng: number | null
          order_id: string | null
          recorded_at: string | null
          speed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "v_orders_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      v_orders_enriched: {
        Row: {
          created_at: string | null
          customer_name: string | null
          delivery_time_min: number | null
          id: string | null
          order_number: number | null
          payment_method: string | null
          payment_status: string | null
          prep_time_min: number | null
          status: string | null
          store_id: string | null
          time_to_accept_min: number | null
          total: number | null
          total_cycle_time_min: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      v_sales_daily: {
        Row: {
          aov: number | null
          cancel_rate: number | null
          date: string | null
          day: string | null
          delivery_fee_sum: number | null
          delivery_fees: number | null
          delivery_share: number | null
          discounts: number | null
          discounts_sum: number | null
          gross_revenue: number | null
          net_revenue: number | null
          order_count: number | null
          orders_count: number | null
          paid_rate: number | null
          pickup_share: number | null
          revenue: number | null
          store_id: string | null
          table_share: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      v_sales_hourly: {
        Row: {
          aov: number | null
          gross_revenue: number | null
          hour: number | null
          orders_count: number | null
          store_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_loyalty_points: { Args: { p_order_id: string }; Returns: boolean }
      can_submit_review: {
        Args: { p_store_id: string; p_user_id: string }
        Returns: boolean
      }
      create_table_order: {
        Args: {
          p_items: Json
          p_notes?: string
          p_session_id: string
          p_store_id: string
        }
        Returns: string
      }
      get_billing_gate: { Args: { p_store_id: string }; Returns: Json }
      get_store_current_usage: { Args: { p_store_id: string }; Returns: Json }
      get_store_plan_entitlements: {
        Args: { p_store_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_store_access: {
        Args: { p_store_id: string; p_user_id: string }
        Returns: boolean
      }
      has_store_role: {
        Args: {
          p_roles: Database["public"]["Enums"]["store_role"][]
          p_store_id: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "customer" | "admin" | "staff" | "driver" | "owner" | "waiter"
      coupon_type: "percent" | "value" | "free_delivery"
      delivery_type: "delivery" | "pickup" | "table"
      notification_type: "order" | "promo" | "system"
      option_type: "size" | "crust" | "extra" | "half_half" | "note"
      order_status:
        | "created"
        | "paid"
        | "accepted"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "delivered"
        | "canceled"
        | "rejected"
        | "served"
      payment_method: "pix" | "card" | "cash"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      store_role: "owner" | "admin" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["customer", "admin", "staff", "driver", "owner", "waiter"],
      coupon_type: ["percent", "value", "free_delivery"],
      delivery_type: ["delivery", "pickup", "table"],
      notification_type: ["order", "promo", "system"],
      option_type: ["size", "crust", "extra", "half_half", "note"],
      order_status: [
        "created",
        "paid",
        "accepted",
        "preparing",
        "ready",
        "out_for_delivery",
        "delivered",
        "canceled",
        "rejected",
        "served",
      ],
      payment_method: ["pix", "card", "cash"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      store_role: ["owner", "admin", "staff"],
    },
  },
} as const
