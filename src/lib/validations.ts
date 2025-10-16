import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Helper para validação de email único
export const validateUniqueEmail = async (email: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('id') // Apenas precisamos saber se existe
    .eq('email', email.toLowerCase())
    .single();
  
  return !data; // Retorna true se o email NÃO existir (ou seja, é único)
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
    .refine(validateUniqueEmail, {
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
  video_url: z.string()
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
  preco_mensal: z.coerce.number()
    .positive('Preço mensal deve ser maior que zero'),
  preco_anual: z.coerce.number()
    .positive('Preço anual deve ser maior que zero')
    .optional()
    .or(z.literal(0)) // Permite 0 para indicar que não há preço anual
    .transform(e => e === 0 ? undefined : e), // Transforma 0 de volta para undefined
  max_alunos: z.coerce.number()
    .int('Limite de alunos deve ser um número inteiro')
    .min(0, 'Limite de alunos não pode ser negativo'),
  recursos: z.array(z.string().min(1, 'Recurso não pode ser vazio')).optional(),
  ativo: z.boolean().default(true),
}).refine((data) => {
  if (data.preco_anual !== undefined && data.preco_anual > 0 && data.preco_mensal * 12 < data.preco_anual) {
    return false; // Preço anual não pode ser maior que 12x o mensal
  }
  return true;
}, {
  message: "Preço anual não pode ser maior que 12x o preço mensal",
  path: ["preco_anual"],
});

// Schema para atribuição de plano a personal trainer
export const assignPlanSchema = z.object({
  personalId: z.string().uuid('ID do personal inválido'),
  planId: z.string().uuid('Selecione um plano'),
  desconto_percentual: z.coerce.number()
    .min(0, 'Desconto não pode ser negativo')
    .max(100, 'Desconto não pode ser maior que 100%')
    .default(0),
  periodo: z.enum(['mensal', 'anual'], {
    errorMap: () => ({ message: "Selecione um período de assinatura" }),
  }),
});