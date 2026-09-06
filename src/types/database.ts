/**
 * Hand-authored to match supabase/migrations/*.sql until a live project
 * exists and `supabase gen types typescript` (Phase 1 step 9) generates
 * the real thing from it - shape follows that command's output exactly so
 * nothing downstream needs to change, only this file gets overwritten.
 */

export type AppRole = "admin" | "manager" | "staff" | "read_only";
export type VerificationStatus = "unverified" | "verified" | "uncertain";
export type InventoryStatus = "active" | "discontinued" | "damaged";
export type MovementType =
  "in" | "out" | "transfer" | "adjust" | "damaged" | "returned";

type TimestampColumns = {
  created_at: string;
  updated_at: string;
};

type SoftDeleteColumn = {
  deleted_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: AppRole;
          full_name: string | null;
        } & TimestampColumns;
        Insert: {
          id: string;
          role?: AppRole;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      brands: {
        Row: { id: string; name: string } & TimestampColumns & SoftDeleteColumn;
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: { id: string; name: string } & TimestampColumns & SoftDeleteColumn;
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      catalogue_sources: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["catalogue_sources"]["Insert"]
        >;
        Relationships: [];
      };
      catalogue_model_families: {
        Row: {
          id: string;
          brand_id: string | null;
          name: string;
        } & TimestampColumns &
          SoftDeleteColumn;
        Insert: {
          id?: string;
          brand_id?: string | null;
          name: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["catalogue_model_families"]["Insert"]
        >;
        Relationships: [];
      };
      catalogue_models: {
        Row: {
          id: string;
          brand_id: string;
          model_family_id: string | null;
          name: string;
          model_code: string | null;
          fuel_type: string | null;
        } & TimestampColumns &
          SoftDeleteColumn;
        Insert: {
          id?: string;
          brand_id: string;
          model_family_id?: string | null;
          name: string;
          model_code?: string | null;
          fuel_type?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["catalogue_models"]["Insert"]
        >;
        Relationships: [];
      };
      catalogue_parts: {
        Row: {
          id: string;
          part_number: string;
          name: string;
          brand_id: string | null;
          category_id: string | null;
          sub_category: string | null;
          assembly_group: string | null;
          is_fastener: boolean;
          capacity_range_kg: string | null;
          oem_reference: string | null;
          description: string | null;
          verification_status: VerificationStatus;
        } & TimestampColumns &
          SoftDeleteColumn;
        Insert: {
          id?: string;
          part_number: string;
          name: string;
          brand_id?: string | null;
          category_id?: string | null;
          sub_category?: string | null;
          assembly_group?: string | null;
          is_fastener?: boolean;
          capacity_range_kg?: string | null;
          oem_reference?: string | null;
          description?: string | null;
          verification_status?: VerificationStatus;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["catalogue_parts"]["Insert"]
        >;
        Relationships: [];
      };
      catalogue_part_sources: {
        Row: {
          id: string;
          catalogue_part_id: string;
          source_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          catalogue_part_id: string;
          source_id: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["catalogue_part_sources"]["Insert"]
        >;
        Relationships: [];
      };
      cross_refs: {
        Row: {
          id: string;
          catalogue_part_id: string;
          cross_reference_number: string;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          catalogue_part_id: string;
          cross_reference_number: string;
          source?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cross_refs"]["Insert"]>;
        Relationships: [];
      };
      compatibility: {
        Row: {
          id: string;
          catalogue_part_id: string;
          catalogue_model_id: string;
          source_id: string | null;
          verification_status: VerificationStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          catalogue_part_id: string;
          catalogue_model_id: string;
          source_id?: string | null;
          verification_status?: VerificationStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["compatibility"]["Insert"]
        >;
        Relationships: [];
      };
      warehouses: {
        Row: {
          id: string;
          name: string;
          address: string | null;
        } & TimestampColumns &
          SoftDeleteColumn;
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["warehouses"]["Insert"]>;
        Relationships: [];
      };
      racks: {
        Row: {
          id: string;
          warehouse_id: string;
          code: string;
        } & TimestampColumns &
          SoftDeleteColumn;
        Insert: {
          id?: string;
          warehouse_id: string;
          code: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["racks"]["Insert"]>;
        Relationships: [];
      };
      shelves: {
        Row: {
          id: string;
          rack_id: string;
          code: string;
        } & TimestampColumns &
          SoftDeleteColumn;
        Insert: {
          id?: string;
          rack_id: string;
          code: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["shelves"]["Insert"]>;
        Relationships: [];
      };
      boxes: {
        Row: {
          id: string;
          shelf_id: string;
          code: string;
        } & TimestampColumns &
          SoftDeleteColumn;
        Insert: {
          id?: string;
          shelf_id: string;
          code: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["boxes"]["Insert"]>;
        Relationships: [];
      };
      inventory_parts: {
        Row: {
          id: string;
          catalogue_part_id: string | null;
          part_number: string;
          name: string;
          box_id: string | null;
          quantity: number;
          min_stock: number | null;
          purchase_cost: number | null;
          selling_price: number | null;
          status: InventoryStatus;
          notes: string | null;
        } & TimestampColumns &
          SoftDeleteColumn;
        Insert: {
          id?: string;
          catalogue_part_id?: string | null;
          part_number: string;
          name: string;
          box_id?: string | null;
          quantity?: number;
          min_stock?: number | null;
          purchase_cost?: number | null;
          selling_price?: number | null;
          status?: InventoryStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["inventory_parts"]["Insert"]
        >;
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          inventory_part_id: string;
          movement_type: MovementType;
          quantity_change: number;
          from_box_id: string | null;
          to_box_id: string | null;
          reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_part_id: string;
          movement_type: MovementType;
          quantity_change: number;
          from_box_id?: string | null;
          to_box_id?: string | null;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["stock_movements"]["Insert"]
        >;
        Relationships: [];
      };
      part_images: {
        Row: {
          id: string;
          inventory_part_id: string;
          storage_path: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_part_id: string;
          storage_path: string;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["part_images"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          previous_state: Record<string, unknown> | null;
          new_state: Record<string, unknown> | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          previous_state?: Record<string, unknown> | null;
          new_state?: Record<string, unknown> | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: AppRole;
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id: string;
          p_previous_state?: Record<string, unknown> | null;
          p_new_state?: Record<string, unknown> | null;
          p_reason?: string | null;
        };
        Returns: undefined;
      };
      soft_delete_box: {
        Args: { p_box_id: string };
        Returns: { part_id: string; part_number: string; name: string }[];
      };
      soft_delete_shelf: {
        Args: { p_shelf_id: string };
        Returns: { part_id: string; part_number: string; name: string }[];
      };
      soft_delete_rack: {
        Args: { p_rack_id: string };
        Returns: { part_id: string; part_number: string; name: string }[];
      };
      soft_delete_warehouse: {
        Args: { p_warehouse_id: string };
        Returns: { part_id: string; part_number: string; name: string }[];
      };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
