
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
                },"approvals": {
                  Row: {
                    "candidate_id": string,"created_at": string,"player_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "candidate_id": string,"created_at"?: string,"player_id"?: string
                  }
                  Update: {
                    "candidate_id"?: string,"created_at"?: string,"player_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "approvals_candidate_id_fkey"
      columns: ["candidate_id"]
isOneToOne: false
      referencedRelation: "candidates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "approvals_player_id_fkey"
      columns: ["player_id"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    }
                  ]
                },"candidates": {
                  Row: {
                    "added_by": string | null,"chosen": boolean,"created_at": string,"game_id": string,"id": string,"poll_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "added_by"?: string | null,"chosen"?: boolean,"created_at"?: string,"game_id": string,"id"?: string,"poll_id": string
                  }
                  Update: {
                    "added_by"?: string | null,"chosen"?: boolean,"created_at"?: string,"game_id"?: string,"id"?: string,"poll_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "candidates_added_by_fkey"
      columns: ["added_by"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "candidates_game_id_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "games"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "candidates_poll_id_fkey"
      columns: ["poll_id"]
isOneToOne: false
      referencedRelation: "polls"
      referencedColumns: ["id"]
    }
                  ]
                },"expansion_owners": {
                  Row: {
                    "expansion_id": string,"player_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "expansion_id": string,"player_id": string
                  }
                  Update: {
                    "expansion_id"?: string,"player_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "expansion_owners_expansion_id_fkey"
      columns: ["expansion_id"]
isOneToOne: false
      referencedRelation: "expansions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "expansion_owners_player_id_fkey"
      columns: ["player_id"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    }
                  ]
                },"expansions": {
                  Row: {
                    "bgg_id": number | null,"created_at": string,"created_by": string | null,"game_id": string,"id": string,"name": string,"notes": string | null,"retired_at": string | null,"updated_at": string,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bgg_id"?: number | null,"created_at"?: string,"created_by"?: string | null,"game_id": string,"id"?: string,"name": string,"notes"?: string | null,"retired_at"?: string | null,"updated_at"?: string,"year"?: number | null
                  }
                  Update: {
                    "bgg_id"?: number | null,"created_at"?: string,"created_by"?: string | null,"game_id"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"retired_at"?: string | null,"updated_at"?: string,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "expansions_game_id_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "games"
      referencedColumns: ["id"]
    }
                  ]
                },"game_attachments": {
                  Row: {
                    "created_at": string,"created_by": string | null,"file_name": string | null,"game_id": string,"id": string,"kind": Database["public"]['Enums']["attachment_kind"],"path": string | null,"size_bytes": number | null,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"file_name"?: string | null,"game_id": string,"id"?: string,"kind": Database["public"]['Enums']["attachment_kind"],"path"?: string | null,"size_bytes"?: number | null,"url"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"file_name"?: string | null,"game_id"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["attachment_kind"],"path"?: string | null,"size_bytes"?: number | null,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "game_attachments_game_id_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "games"
      referencedColumns: ["id"]
    }
                  ]
                },"game_owners": {
                  Row: {
                    "game_id": string,"player_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "game_id": string,"player_id": string
                  }
                  Update: {
                    "game_id"?: string,"player_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "game_owners_game_id_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "games"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "game_owners_player_id_fkey"
      columns: ["player_id"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    }
                  ]
                },"games": {
                  Row: {
                    "bgg_id": number | null,"bgg_image_url": string | null,"complexity": number | null,"cover_path": string | null,"created_at": string,"created_by": string | null,"default_play_mode": Database["public"]['Enums']["play_mode"],"id": string,"lower_score_wins": boolean,"max_duration": number | null,"max_players": number | null,"min_duration": number | null,"min_players": number | null,"name": string,"notes": string | null,"retired_at": string | null,"updated_at": string,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bgg_id"?: number | null,"bgg_image_url"?: string | null,"complexity"?: number | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"default_play_mode"?: Database["public"]['Enums']["play_mode"],"id"?: string,"lower_score_wins"?: boolean,"max_duration"?: number | null,"max_players"?: number | null,"min_duration"?: number | null,"min_players"?: number | null,"name": string,"notes"?: string | null,"retired_at"?: string | null,"updated_at"?: string,"year"?: number | null
                  }
                  Update: {
                    "bgg_id"?: number | null,"bgg_image_url"?: string | null,"complexity"?: number | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"default_play_mode"?: Database["public"]['Enums']["play_mode"],"id"?: string,"lower_score_wins"?: boolean,"max_duration"?: number | null,"max_players"?: number | null,"min_duration"?: number | null,"min_players"?: number | null,"name"?: string,"notes"?: string | null,"retired_at"?: string | null,"updated_at"?: string,"year"?: number | null
                  }
                  Relationships: [
                    
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
                },"participants": {
                  Row: {
                    "play_id": string,"player_id": string,"rank": number | null,"score": number | null,"team_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "play_id": string,"player_id": string,"rank"?: number | null,"score"?: number | null,"team_id"?: string | null
                  }
                  Update: {
                    "play_id"?: string,"player_id"?: string,"rank"?: number | null,"score"?: number | null,"team_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "participants_play_id_fkey"
      columns: ["play_id"]
isOneToOne: false
      referencedRelation: "plays"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "participants_player_id_fkey"
      columns: ["player_id"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "participants_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    }
                  ]
                },"photo_tags": {
                  Row: {
                    "photo_id": string,"player_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "photo_id": string,"player_id": string
                  }
                  Update: {
                    "photo_id"?: string,"player_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "photo_tags_photo_id_fkey"
      columns: ["photo_id"]
isOneToOne: false
      referencedRelation: "photos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "photo_tags_player_id_fkey"
      columns: ["player_id"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    }
                  ]
                },"photos": {
                  Row: {
                    "caption": string | null,"created_at": string,"height": number,"id": string,"path": string,"play_id": string | null,"session_id": string | null,"size_bytes": number,"thumb_path": string,"uploaded_by": string | null,"width": number
                  }
                  ComputedFields: never
                  Insert: {
                    "caption"?: string | null,"created_at"?: string,"height": number,"id"?: string,"path": string,"play_id"?: string | null,"session_id"?: string | null,"size_bytes": number,"thumb_path": string,"uploaded_by"?: string | null,"width": number
                  }
                  Update: {
                    "caption"?: string | null,"created_at"?: string,"height"?: number,"id"?: string,"path"?: string,"play_id"?: string | null,"session_id"?: string | null,"size_bytes"?: number,"thumb_path"?: string,"uploaded_by"?: string | null,"width"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "photos_play_id_fkey"
      columns: ["play_id"]
isOneToOne: false
      referencedRelation: "plays"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "photos_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"play_expansions": {
                  Row: {
                    "expansion_id": string,"play_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "expansion_id": string,"play_id": string
                  }
                  Update: {
                    "expansion_id"?: string,"play_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "play_expansions_expansion_id_fkey"
      columns: ["expansion_id"]
isOneToOne: false
      referencedRelation: "expansions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "play_expansions_play_id_fkey"
      columns: ["play_id"]
isOneToOne: false
      referencedRelation: "plays"
      referencedColumns: ["id"]
    }
                  ]
                },"players": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"created_by": string | null,"deactivated_at": string | null,"display_name": string,"id": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"deactivated_at"?: string | null,"display_name": string,"id"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"created_by"?: string | null,"deactivated_at"?: string | null,"display_name"?: string,"id"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"plays": {
                  Row: {
                    "coop_won": boolean | null,"created_at": string,"created_by": string | null,"duration_minutes": number | null,"ended_at": string | null,"game_id": string,"id": string,"notes": string | null,"play_mode": Database["public"]['Enums']["play_mode"],"session_id": string,"started_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "coop_won"?: boolean | null,"created_at"?: string,"created_by"?: string | null,"duration_minutes"?: number | null,"ended_at"?: string | null,"game_id": string,"id"?: string,"notes"?: string | null,"play_mode": Database["public"]['Enums']["play_mode"],"session_id": string,"started_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "coop_won"?: boolean | null,"created_at"?: string,"created_by"?: string | null,"duration_minutes"?: number | null,"ended_at"?: string | null,"game_id"?: string,"id"?: string,"notes"?: string | null,"play_mode"?: Database["public"]['Enums']["play_mode"],"session_id"?: string,"started_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plays_game_id_fkey"
      columns: ["game_id"]
isOneToOne: false
      referencedRelation: "games"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plays_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"polls": {
                  Row: {
                    "allow_veto": boolean,"closed_at": string | null,"closes_at": string | null,"created_at": string,"created_by": string | null,"id": string,"session_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "allow_veto"?: boolean,"closed_at"?: string | null,"closes_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"session_id": string
                  }
                  Update: {
                    "allow_veto"?: boolean,"closed_at"?: string | null,"closes_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"session_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "polls_session_id_fkey"
      columns: ["session_id"]
isOneToOne: true
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    }
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
                },"rsvps": {
                  Row: {
                    "player_id": string,"response": Database["public"]['Enums']["rsvp_response"],"session_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "player_id"?: string,"response": Database["public"]['Enums']["rsvp_response"],"session_id": string,"updated_at"?: string
                  }
                  Update: {
                    "player_id"?: string,"response"?: Database["public"]['Enums']["rsvp_response"],"session_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rsvps_player_id_fkey"
      columns: ["player_id"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rsvps_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"session_attendees": {
                  Row: {
                    "created_at": string,"player_id": string,"session_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"player_id": string,"session_id": string
                  }
                  Update: {
                    "created_at"?: string,"player_id"?: string,"session_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_attendees_player_id_fkey"
      columns: ["player_id"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_attendees_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"sessions": {
                  Row: {
                    "created_at": string,"created_by": string | null,"date": string,"id": string,"name": string | null,"notes": string | null,"place": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"date": string,"id"?: string,"name"?: string | null,"notes"?: string | null,"place"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"date"?: string,"id"?: string,"name"?: string | null,"notes"?: string | null,"place"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"teams": {
                  Row: {
                    "id": string,"name": string,"play_id": string,"won": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"name": string,"play_id": string,"won"?: boolean
                  }
                  Update: {
                    "id"?: string,"name"?: string,"play_id"?: string,"won"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "teams_play_id_fkey"
      columns: ["play_id"]
isOneToOne: false
      referencedRelation: "plays"
      referencedColumns: ["id"]
    }
                  ]
                },"vetoes": {
                  Row: {
                    "candidate_id": string,"created_at": string,"player_id": string,"poll_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "candidate_id": string,"created_at"?: string,"player_id"?: string,"poll_id": string
                  }
                  Update: {
                    "candidate_id"?: string,"created_at"?: string,"player_id"?: string,"poll_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vetoes_candidate_id_fkey"
      columns: ["candidate_id"]
isOneToOne: false
      referencedRelation: "candidates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "vetoes_player_id_fkey"
      columns: ["player_id"]
isOneToOne: false
      referencedRelation: "players"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "vetoes_poll_id_fkey"
      columns: ["poll_id"]
isOneToOne: false
      referencedRelation: "polls"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "delete_member":
{ Args: { "target": string }; Returns: undefined
                           },
"save_play":
{ Args: { "play": Json }; Returns: string
                           },
"set_game_owners":
{ Args: { "game": string,"owners": (string)[] }; Returns: undefined
                           },
"set_guest_active":
{ Args: { "active": boolean,"target": string }; Returns: undefined
                           },
"set_member_active":
{ Args: { "active": boolean,"target": string }; Returns: undefined
                           }
          }
          Enums: {
            "attachment_kind": "file"|"link","play_mode": "competitive"|"cooperative"|"team","rsvp_response": "yes"|"maybe"|"no"
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
            "attachment_kind": ["file", "link"],"play_mode": ["competitive", "cooperative", "team"],"rsvp_response": ["yes", "maybe", "no"]
          }
        }
} as const
