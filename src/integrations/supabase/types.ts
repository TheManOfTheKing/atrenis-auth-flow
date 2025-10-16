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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agendamentos: {
        Row: {
          aluno_id: string
          created_at: string
          data_hora: string
          id: string
          localizacao: string | null
          observacoes: string | null
          personal_id: string
          status: Database["public"]["Enums"]["agendamento_status"] | null
          tipo: Database["public"]["Enums"]["agendamento_tipo"] | null
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_hora: string
          id?: string
          localizacao?: string | null
          observacoes?: string | null
          personal_id: string
          status?: Database["public"]["Enums"]["agendamento_status"] | null
          tipo?: Database["public"]["Enums"]["agendamento_tipo"] | null
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_hora?: string
          id?: string
          localizacao?: string | null
          observacoes?: string | null
          personal_id?: string
          status?: Database["public"]["Enums"]["agendamento_status"] | null
          tipo?: Database["public"]["Enums"]["agendamento_tipo"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aluno_treinos: {
        Row: {
          aluno_id: string
          created_at: string
          data_atribuicao: string
          id: string
          observacoes: string | null
          personal_id: string
          status: Database["public"]["Enums"]["aluno_treino_status"] | null
          treino_id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_atribuicao?: string
          id?: string
          observacoes?: string | null
          personal_id: string
          status?: Database["public"]["Enums"]["aluno_treino_status"] | null
          treino_id: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_atribuicao?: string
          id?: string
          observacoes?: string | null
          personal_id?: string
          status?: Database["public"]["Enums"]["aluno_treino_status"] | null
          treino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aluno_treinos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aluno_treinos_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aluno_treinos_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          autor_id: string
          created_at: string
          destinatario_id: string
          execucao_id: string | null
          id: string
          lido: boolean | null
          mensagem: string
          tipo: Database["public"]["Enums"]["comentario_tipo"] | null
        }
        Insert: {
          autor_id: string
          created_at?: string
          destinatario_id: string
          execucao_id?: string | null
          id?: string
          lido?: boolean | null
          mensagem: string
          tipo?: Database["public"]["Enums"]["comentario_tipo"] | null
        }
        Update: {
          autor_id?: string
          created_at?: string
          destinatario_id?: string
          execucao_id?: string | null
          id?: string
          lido?: boolean | null
          mensagem?: string
          tipo?: Database["public"]["Enums"]["comentario_tipo"] | null
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "treino_execucoes"
            referencedColumns: ["id"]
          },
        ]
      }
      exercicios: {
        Row: {
          created_at: string
          criado_por_personal_id: string | null
          descricao: string | null
          grupo_muscular: string | null
          id: string
          nome: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          criado_por_personal_id?: string | null
          descricao?: string | null
          grupo_muscular?: string | null
          id?: string
          nome: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          criado_por_personal_id?: string | null
          descricao?: string | null
          grupo_muscular?: string | null
          id?: string
          nome?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercicios_criado_por_personal_id_fkey"
            columns: ["criado_por_personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          id: string
          max_alunos: number | null
          nome: string
          preco_anual: number | null
          preco_mensal: number
          recursos: Json | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          max_alunos?: number | null
          nome: string
          preco_anual?: number | null
          preco_mensal: number
          recursos?: Json | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          max_alunos?: number | null
          nome?: string
          preco_anual?: number | null
          preco_mensal?: number
          recursos?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          cref: string | null
          data_nascimento: string | null
          email: string
          foto_perfil: string | null
          id: string
          nome: string
          objetivo: string | null
          observacoes_aluno: string | null
          personal_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          subscription_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cref?: string | null
          data_nascimento?: string | null
          email: string
          foto_perfil?: string | null
          id: string
          nome: string
          objetivo?: string | null
          observacoes_aluno?: string | null
          personal_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cref?: string | null
          data_nascimento?: string | null
          email?: string
          foto_perfil?: string | null
          id?: string
          nome?: string
          objetivo?: string | null
          observacoes_aluno?: string | null
          personal_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          subscription_id?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      treino_execucoes: {
        Row: {
          aluno_id: string
          aluno_treino_id: string
          avaliacao: number | null
          created_at: string
          data_execucao: string
          exercicios_concluidos: Json | null
          feedback_aluno: string | null
          id: string
          tempo_execucao_min: number | null
        }
        Insert: {
          aluno_id: string
          aluno_treino_id: string
          avaliacao?: number | null
          created_at?: string
          data_execucao?: string
          exercicios_concluidos?: Json | null
          feedback_aluno?: string | null
          id?: string
          tempo_execucao_min?: number | null
        }
        Update: {
          aluno_id?: string
          aluno_treino_id?: string
          avaliacao?: number | null
          created_at?: string
          data_execucao?: string
          exercicios_concluidos?: Json | null
          feedback_aluno?: string | null
          id?: string
          tempo_execucao_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treino_execucoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treino_execucoes_aluno_treino_id_fkey"
            columns: ["aluno_treino_id"]
            isOneToOne: false
            referencedRelation: "aluno_treinos"
            referencedColumns: ["id"]
          },
        ]
      }
      treino_exercicios: {
        Row: {
          carga: string | null
          created_at: string
          descanso_seg: number | null
          exercicio_id: string
          id: string
          observacoes: string | null
          ordem: number | null
          repeticoes: string | null
          series: string | null
          treino_id: string
        }
        Insert: {
          carga?: string | null
          created_at?: string
          descanso_seg?: number | null
          exercicio_id: string
          id?: string
          observacoes?: string | null
          ordem?: number | null
          repeticoes?: string | null
          series?: string | null
          treino_id: string
        }
        Update: {
          carga?: string | null
          created_at?: string
          descanso_seg?: number | null
          exercicio_id?: string
          id?: string
          observacoes?: string | null
          ordem?: number | null
          repeticoes?: string | null
          series?: string | null
          treino_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treino_exercicios_exercicio_id_fkey"
            columns: ["exercicio_id"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treino_exercicios_treino_id_fkey"
            columns: ["treino_id"]
            isOneToOne: false
            referencedRelation: "treinos"
            referencedColumns: ["id"]
          },
        ]
      }
      treinos: {
        Row: {
          ativo: boolean | null
          created_at: string
          descricao: string | null
          duracao_estimada_min: number | null
          id: string
          nome: string
          personal_id: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          duracao_estimada_min?: number | null
          id?: string
          nome: string
          personal_id: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          descricao?: string | null
          duracao_estimada_min?: number | null
          id?: string
          nome?: string
          personal_id?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treinos_personal_id_fkey"
            columns: ["personal_id"]
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
      get_aluno_stats: {
        Args: { aluno_uuid: string }
        Returns: {
          execucoes_mes: number
          media_avaliacao: number
          total_execucoes: number
          treinos_ativos: number
          treinos_concluidos: number
        }[]
      }
      get_my_personal_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_personal_stats: {
        Args: { personal_uuid: string }
        Returns: {
          execucoes_mes: number
          total_alunos: number
          total_execucoes: number
          total_treinos: number
        }[]
      }
      get_upcoming_appointments: {
        Args: { days_ahead?: number; user_uuid: string }
        Returns: {
          aluno_id: string
          created_at: string
          data_hora: string
          id: string
          localizacao: string | null
          observacoes: string | null
          personal_id: string
          status: Database["public"]["Enums"]["agendamento_status"] | null
          tipo: Database["public"]["Enums"]["agendamento_tipo"] | null
          updated_at: string
        }[]
      }
      search_exercicios: {
        Args: { grupo?: string; search_term?: string }
        Returns: {
          created_at: string
          criado_por_personal_id: string | null
          descricao: string | null
          grupo_muscular: string | null
          id: string
          nome: string
          updated_at: string
          video_url: string | null
        }[]
      }
    }
    Enums: {
      agendamento_status: "agendado" | "confirmado" | "concluido" | "cancelado"
      agendamento_tipo: "treino" | "avaliacao" | "consulta"
      aluno_treino_status: "ativo" | "concluido" | "cancelado"
      comentario_tipo: "feedback" | "duvida" | "orientacao"
      subscription_status:
        | "pending"
        | "active"
        | "inactive"
        | "trialing"
        | "past_due"
        | "canceled"
      user_role: "admin" | "personal" | "aluno"
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
      agendamento_status: ["agendado", "confirmado", "concluido", "cancelado"],
      agendamento_tipo: ["treino", "avaliacao", "consulta"],
      aluno_treino_status: ["ativo", "concluido", "cancelado"],
      comentario_tipo: ["feedback", "duvida", "orientacao"],
      subscription_status: [
        "pending",
        "active",
        "inactive",
        "trialing",
        "past_due",
        "canceled",
      ],
      user_role: ["admin", "personal", "aluno"],
    },
  },
} as const