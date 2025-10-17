import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Helper para validação de email único
export const validateUniqueEmail = async (email: string, currentUserId?: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('id') // Apenas precisamos saber se existe
    .eq('email', email.toLowerCase())
    .single();
  
  // Se data existe e o ID é diferente do usuário atual (em caso de edição), então não é único
  return !data || (currentUserId && data.id === currentUserId);
};

// Schema para validação de senha
export const passwordSchema = z.string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número');

// Schema para cadastro de aluno
export const alunoSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .refine(async (email) => await validateUniqueEmail(email), {
      message: "Este email já está cadastrado.",
    }),
  telefone: z.string()
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Telefone inválido. Use: (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal('')), // Permite string vazia para opcional
  data_nascimento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use o formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')), // Permite string vazia para opcional
  objetivo: z.enum(['emagrecimento', 'hipertrofia', 'condicionamento', 'reabilitacao', 'outro'], {
    errorMap: () => ({ message: "Selecione um objetivo" }),
  }),
  observacoes: z.string()
    .max(1000, 'Observações muito longas')
    .optional()
    .or(z.literal('')), // Permite string vazia para opcional
});

// Schema para cadastro/edição de exercício
export const exercicioSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  descricao: z.string()
    .max(500, 'Descrição muito longa')
    .optional()
    .or(z.literal('')), // Permite string vazia para opcional
  grupo_muscular: z.string()
    .min(1, 'Selecione um grupo muscular'),
  equipamento: z.string()
    .optional()
    .or(z.literal('')), // Permite string vazia para opcional
  dificuldade: z.string()
    .optional()
    .or(z.literal('')), // Permite string vazia para opcional
  video_url: z.string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')), // Permite string vazia para opcional
  imagem_url: z.string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')), // Permite string vazia para opcional
});

// Schema para informações básicas do treino (Step 1 do NovoTreino)
export const treinoInfoSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  tipo: z.string()
    .min(1, 'Selecione um tipo de treino'),
  duracao_estimada_min: z.coerce.number()
    .int('Duração deve ser um número inteiro')
    .positive('Duração deve ser positiva')
    .min(5, 'Duração mínima de 5 minutos')
    .max(180, 'Duração máxima de 180 minutos'),
  descricao: z.string()
    .max(500, 'Descrição muito longa')
    .optional()
    .or(z.literal('')), // Permite string vazia para opcional
});

// Schema para um item de exercício dentro de um treino
export const treinoExercicioItemSchema = z.object({
  exercicio_id: z.string().uuid('ID do exercício inválido'),
  ordem: z.coerce.number().int().positive('Ordem deve ser um número positivo'),
  series: z.string().min(1, 'Séries são obrigatórias'),
  repeticoes: z.string().min(1, 'Repetições são obrigatórias'),
  carga: z.string().optional().or(z.literal('')),
  descanso_seg: z.coerce.number().int().positive('Descanso deve ser um número positivo em segundos').optional().or(z.literal('')),
  observacoes: z.string().max(200, 'Observações muito longas').optional().or(z.literal('')),
});

// Schema completo para treino (incluindo exercícios)
export const treinoSchema = treinoInfoSchema.extend({
  exercicios: z.array(treinoExercicioItemSchema).min(1, 'Adicione pelo menos um exercício ao treino'),
});

// Schema para atualização de perfil
export const profileUpdateSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo'),
  telefone: z.string()
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Telefone inválido. Use: (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal('')),
  data_nascimento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use o formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  cref: z.string()
    .regex(/^CREF \d{6}-[A-Z]\/[A-Z]{2}$/, 'Formato do CREF inválido (ex: CREF 123456-G/SP)')
    .optional()
    .or(z.literal('')),
  objetivo: z.string().max(500, 'Objetivo muito longo').optional().or(z.literal('')),
  observacoes_aluno: z.string().max(1000, 'Observações muito longas').optional().or(z.literal('')),
});

// Schema para recuperação de senha
export const recuperarSenhaSchema = z.object({
  email: z.string().email("Email inválido"),
});

// Schema para redefinição de senha
export const redefinirSenhaSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Schema para planos de assinatura
export const planSchema = z.object({
  id: z.string().uuid().optional(), // Para edição
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  descricao: z.string()
    .max(500, 'Descrição muito longa')
    .optional()
    .or(z.literal('')),
  tipo: z.enum(['publico', 'vitalicio'], {
    errorMap: () => ({ message: "Selecione um tipo de plano" }),
  }),
  preco_mensal: z.coerce.number()
    .min(0, 'Preço mensal não pode ser negativo'),
  preco_anual: z.coerce.number()
    .min(0, 'Preço anual não pode ser negativo')
    .optional()
    .or(z.literal(0)) // Permite 0 para indicar que não há preço anual
    .transform(e => e === 0 ? undefined : e), // Transforma 0 de volta para undefined
  max_alunos: z.coerce.number()
    .int('Limite de alunos deve ser um número inteiro')
    .min(0, 'Limite de alunos não pode ser negativo'),
  recursos: z.array(z.string().min(1, 'Recurso não pode ser vazio')).optional(),
  ativo: z.boolean().default(true),
  visivel_landing: z.boolean().default(true),
  ordem_exibicao: z.coerce.number()
    .int('Ordem de exibição deve ser um número inteiro')
    .min(0, 'Ordem de exibição não pode ser negativa')
    .default(0),
}).superRefine((data, ctx) => {
  // Validação de preço mensal para planos vitalícios
  if (data.tipo === 'vitalicio' && data.preco_mensal !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Preço mensal deve ser 0 para planos vitalícios.",
      path: ["preco_mensal"],
    });
  }
  
  // Validação de preço mensal para planos públicos
  if (data.tipo === 'publico' && data.preco_mensal <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Preço mensal deve ser maior que 0 para planos públicos.",
      path: ["preco_mensal"],
    });
  }
  // Validação de preço anual
  if (data.preco_anual !== undefined && data.preco_anual > 0 && data.preco_mensal * 12 < data.preco_anual) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Preço anual não pode ser maior que 12x o preço mensal",
      path: ["preco_anual"],
    });
  }
  // Validação de visibilidade na landing para planos vitalícios
  if (data.tipo === 'vitalicio' && data.visivel_landing) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Planos vitalícios não podem ser visíveis na landing page.",
      path: ["visivel_landing"],
    });
  }
});

// Schema para atribuição de plano a personal trainer
export const assignPlanSchema = z.object({
  personalId: z.string().uuid('ID do personal inválido'),
  planId: z.string().uuid('Selecione um plano'),
  desconto_percentual: z.coerce.number()
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode ser maior que 100%')
    .default(0),
  periodo: z.enum(['mensal', 'anual', 'vitalicio'], { // Adicionado 'vitalicio'
    errorMap: () => ({ message: "Selecione um período de assinatura" }),
  }),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida. Use o formato YYYY-MM-DD'),
  observacoes: z.string().max(500, 'Observações muito longas').optional().or(z.literal('')),
});

// Schema para criação/edição de personal trainer pelo admin
export const personalAdminSchema = z.object({
  id: z.string().uuid().optional(), // Apenas para edição
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido").toLowerCase(),
  telefone: z.string().optional().or(z.literal('')),
  cref: z.string().optional().refine((cref) => {
    if (!cref) return true;
    return /^CREF \d{6}-[A-Z]{1}\/[A-Z]{2}$/.test(cref);
  }, {
    message: "Formato do CREF inválido (ex: CREF 123456-G/SP)",
  }).or(z.literal('')),
  planId: z.string().uuid().optional().or(z.literal('')), // Opcional para criação, pode ser atribuído depois
  desconto_percentual: z.coerce.number()
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode ser maior que 100%')
    .default(0),
  periodo: z.enum(['mensal', 'anual', 'vitalicio', 'none'], { // Adicionado 'vitalicio'
    errorMap: () => ({ message: "Selecione um período de assinatura" }),
  }).default('none'),
}).superRefine(async (data, ctx) => {
  // Validação de email único para criação e edição
  const isEmailUnique = await validateUniqueEmail(data.email, data.id);
  if (!isEmailUnique) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Este email já está cadastrado.",
      path: ["email"],
    });
  }

  // Validação de plano e período
  if (data.planId && data.periodo === 'none') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Se um plano for selecionado, o período é obrigatório.",
      path: ["periodo"],
    });
  }
  if (!data.planId && data.periodo !== 'none') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Se um período for selecionado, o plano é obrigatório.",
      path: ["planId"],
    });
  }
});

// Schema para exercício dentro de um treino
export const workoutExerciseSchema = z.object({
  exercicio_id: z.string().uuid('ID do exercício inválido'),
  ordem: z.number().int().positive('Ordem deve ser um número positivo'),
  series: z.string().min(1, 'Séries são obrigatórias'),
  repeticoes: z.string().min(1, 'Repetições são obrigatórias'),
  carga: z.string().optional().default(''),
  descanso_seg: z.number().int().min(0).default(60),
  observacoes: z.string().optional().default('')
});

// Schema completo para treino (incluindo exercícios)
export const workoutFormSchema = z.object({
  // Etapa 1 - Informações básicas
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  descricao: z.string()
    .max(500, 'Descrição muito longa')
    .optional()
    .or(z.literal('')),
  tipo: z.string()
    .min(1, 'Selecione um tipo de treino')
    .default('personalizado'),
  duracao_estimada_min: z.coerce.number()
    .int('Duração deve ser um número inteiro')
    .positive('Duração deve ser positiva')
    .min(5, 'Duração mínima de 5 minutos')
    .max(180, 'Duração máxima de 180 minutos')
    .optional(),
  
  // Etapa 2 - Exercícios
  exercicios: z.array(workoutExerciseSchema).min(1, 'Adicione pelo menos 1 exercício ao treino')
});

// Tipos inferidos dos schemas
export type WorkoutFormData = z.infer<typeof workoutFormSchema>;
export type WorkoutExerciseData = z.infer<typeof workoutExerciseSchema>;