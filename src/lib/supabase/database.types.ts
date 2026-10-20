
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "allowed_emails": {
                  Row: {
                    "added_by": string | null,"created_at": string,"email": string,"is_admin": boolean,"player_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "added_by"?: string | null,"created_at"?: string,"email": string,"is_admin"?: boolean,"player_id"?: string | null
                  }
                  Update: {
                    "added_by"?: string | null,"created_at"?: string,"email"?: string,"is_admin"?: boolean,"player_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "allowed_emails_player_id_fkey"
      columns: ["player_id"]
isOneToOne: true
      referencedRelation: "players"
      referencedColumns: ["id"]
    }
                  ]
                },"expansions": {
                  Row: {
                    "bgg_id": number | null,"created_at": string,"created_by": string | null,"game_id": string,"id": string,"name": string,"notes": string | null,"owner_id": string | null,"retired_at": string | null,"updated_at": string,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bgg_id"?: number | null,"created_at"?: string,"created_by"?: string | null,"game_id": string,"id"?: string,"name": string,"notes"?: string | null,"owner_id"?: string | null,"retired_at"?: string | null,"updated_at"?: string,"year"?: number | null
                  }
                  Update: {
                    "bgg_id"?: number | null,"created_at"?: string,"created_by"?: string | null,"game_id"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"owner_id"?: string | null,"retired_at"?: string | null,"updated_at"?: string,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "expansions_game_id_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "games"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expansions_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    }
                  ]
                },"games": {
                  Row: {
                    "bgg_id": number | null,"bgg_image_url": string | null,"complexity": number | null,"cover_path": string | null,"created_at": string,"created_by": string | null,"default_play_mode": Database["public"]['Enums']["play_mode"],"id": string,"lower_score_wins": boolean,"max_duration": number | null,"max_players": number | null,"min_duration": number | null,"min_players": number | null,"name": string,"notes": string | null,"owner_id": string | null,"retired_at": string | null,"updated_at": string,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bgg_id"?: number | null,"bgg_image_url"?: string | null,"complexity"?: number | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"default_play_mode"?: Database["public"]['Enums']["play_mode"],"id"?: string,"lower_score_wins"?: boolean,"max_duration"?: number | null,"max_players"?: number | null,"min_duration"?: number | null,"min_players"?: number | null,"name": string,"notes"?: string | null,"owner_id"?: string | null,"retired_at"?: string | null,"updated_at"?: string,"year"?: number | null
                  }
                  Update: {
                    "bgg_id"?: number | null,"bgg_image_url"?: string | null,"complexity"?: number | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"default_play_mode"?: Database["public"]['Enums']["play_mode"],"id"?: string,"lower_score_wins"?: boolean,"max_duration"?: number | null,"max_players"?: number | null,"min_duration"?: number | null,"min_players"?: number | null,"name"?: string,"notes"?: string | null,"owner_id"?: string | null,"retired_at"?: string | null,"updated_at"?: string,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "games_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    }
                  ]
                },"keep_alive": {
                  Row: {
                    "id": number,"pinged_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: number,"pinged_at"?: string
                  }
                  Update: {
                    "id"?: number,"pinged_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"players": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"created_by": string | null,"display_name": string,"id": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"display_name": string,"id"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"display_name"?: string,"id"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"ratings": {
                  Row: {
                    "game_id": string,"player_id": string,"stars": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "game_id": string,"player_id"?: string,"stars": number,"updated_at"?: string
                  }
                  Update: {
                    "game_id"?: string,"player_id"?: string,"stars"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ratings_game_id_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "games"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ratings_player_id_fkey"
      columns: ["player_id"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            "play_mode": "competitive"|"cooperative"|"team"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "play_mode": ["competitive", "cooperative", "team"]
          }
        }
} as const
