/**
 * Supabase generated types.
 *
 * Regenerate after schema changes:
 *   pnpm db:types
 * (requires the Supabase CLI + a linked project, or a local `supabase start`).
 *
 * This is a partial type definition for Phase 3 tables.
 * Once generated via `supabase gen types`, replace this with the full output.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'admin' | 'editor';
          full_name: string | null;
          is_locked: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'admin' | 'editor';
          full_name?: string | null;
          is_locked?: boolean;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          role?: 'admin' | 'editor';
          full_name?: string | null;
          is_locked?: boolean;
          created_by?: string | null;
        };
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_by?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          slug: string;
          category: string;
          title: string;
          client: string | null;
          location: string | null;
          date: string | null;
          status: string;
          description_vi: string | null;
          description_en: string | null;
          images: Json;
          attachments: Json;
          parse_status: string;
          parse_version: number;
          parse_error: string | null;
          position: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      project_sections: {
        Row: {
          id: string;
          project_id: string;
          type: string;
          title_vi: string | null;
          title_en: string | null;
          content_vi: string | null;
          content_en: string | null;
          items: Json;
          sort_order: number;
          source_doc: string | null;
          status: string;
          parse_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      contact_messages: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      audit_logs: {
        Row: {
          id: number;
          actor: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: 'admin' | 'editor';
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type DatabasePublic = Database['public'];
