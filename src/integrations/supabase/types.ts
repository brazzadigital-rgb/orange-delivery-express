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
          created_at: string
          estimated_minutes: number | null
          fee: number
          id: string
          max_distance: number
          min_distance: number | null
          min_order_value: number | null
          name: string
          store_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          estimated_minutes?: number | null
          fee: number
          id?: string
          max_distance: number
          min_distance?: number | null
          min_order_value?: number | null
          name: string
          store_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          estimated_minutes?: number | null
          fee?: number
          id?: string
          max_distance?: number
          min_distance?: number | null
          min_order_value?: number | null
          name?: string
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
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
            foreignKeyName: "reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address_text: string | null
          created_at: string
          id: string
          is_open: boolean | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          min_order_value: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          primary_color: string | null
          updated_at: string
        }
        Insert: {
          address_text?: string | null
          created_at?: string
          id?: string
          is_open?: boolean | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          min_order_value?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          primary_color?: string | null
          updated_at?: string
        }
        Update: {
          address_text?: string | null
          created_at?: string
          id?: string
          is_open?: boolean | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          min_order_value?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          primary_color?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
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
    },
  },
} as const
