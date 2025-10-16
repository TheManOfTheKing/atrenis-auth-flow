# Inconsistências Identificadas entre Código e Banco de Dados

## Data: 16/10/2025

---

## 🔴 PROBLEMA CRÍTICO 1: Função `get_my_role()` não existe

### Impacto:
**CRÍTICO** - Bloqueia TODAS as operações do administrador

### Descrição:
As políticas RLS (Row Level Security) das tabelas `profiles` e `plans` usam a função `get_my_role()` para verificar se o usuário é admin, mas essa função **NÃO EXISTE** no banco de dados.

### Localização no código:
- `supabase/migrations/YYYYMMDDHHMMSS_initial_schema_setup.sql` (linhas 114, 118, 122, 126, 130, 134)

### Políticas RLS afetadas:
```sql
-- Profiles
CREATE POLICY "Admins podem ver todos os perfis" ON public.profiles
FOR SELECT TO authenticated
USING (get_my_role() = 'admin'::user_role);  -- ❌ FUNÇÃO NÃO EXISTE

CREATE POLICY "Admins podem atualizar todos os perfis" ON public.profiles
FOR UPDATE TO authenticated
USING (get_my_role() = 'admin'::user_role);  -- ❌ FUNÇÃO NÃO EXISTE

CREATE POLICY "Admins podem deletar perfis" ON public.profiles
FOR DELETE TO authenticated
USING (get_my_role() = 'admin'::user_role);  -- ❌ FUNÇÃO NÃO EXISTE

CREATE POLICY "Personal pode ver perfis de seus alunos" ON public.profiles
FOR SELECT TO authenticated
USING (get_my_role() = 'personal'::user_role AND personal_id = auth.uid());  -- ❌ FUNÇÃO NÃO EXISTE

CREATE POLICY "Personal pode criar alunos" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (get_my_role() = 'personal'::user_role AND personal_id = auth.uid());  -- ❌ FUNÇÃO NÃO EXISTE

CREATE POLICY "Personal pode atualizar seus alunos" ON public.profiles
FOR UPDATE TO authenticated
USING (get_my_role() = 'personal'::user_role AND personal_id = auth.uid() AND role = 'aluno'::user_role);  -- ❌ FUNÇÃO NÃO EXISTE
```

### Consequência:
Todas as queries que dependem dessas políticas RLS **FALHAM**, impedindo o admin de:
- Ver lista de personal trainers
- Ver lista de planos
- Criar/editar/deletar personal trainers
- Criar/editar/deletar planos

### Solução:
✅ **Migration criada**: `YYYYMMDDHHMMSS_create_get_my_role_function.sql`

---

## 🔴 PROBLEMA CRÍTICO 2: Campo `tipo` não existe na tabela `plans`

### Impacto:
**CRÍTICO** - Bloqueia a listagem e criação de planos

### Descrição:
O código TypeScript usa extensivamente o campo `tipo` (ENUM: 'publico' | 'vitalicio') na tabela `plans`, mas esse campo **NÃO EXISTE** no schema SQL.

### Localização no código TypeScript:
- `src/hooks/usePlans.ts` (linhas 13, 31-33, 99, 108, 235)
- `src/components/admin/AssignPlanToPersonalDialog.tsx` (linhas 93, 231, 278, 280, 286, 298)
- `src/components/admin/PersonalFormDialog.tsx` (linhas 270, 278, 286, 297, 327)
- `src/components/admin/PlanCardPreview.tsx` (linha 12)
- `src/pages/admin/PersonalDetailsPage.tsx` (linha 103)
- `src/pages/admin/PersonalTrainers.tsx` (linhas 132, 345-346)
- `src/lib/validations.ts` (linhas 145, 171, 187)

### Exemplos de uso:
```typescript
// usePlans.ts
if (filters?.tipo !== undefined && filters.tipo !== null) {
  query = query.eq('tipo', filters.tipo);  // ❌ CAMPO NÃO EXISTE
}

// PersonalTrainers.tsx
if (personal.plano_vitalicio || plan.tipo === 'vitalicio') {  // ❌ CAMPO NÃO EXISTE
  return 0;
}
```

### Schema SQL atual:
```sql
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_mensal NUMERIC NOT NULL,
  preco_anual NUMERIC,
  max_alunos INTEGER,
  recursos JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT TRUE,
  -- ❌ FALTA: tipo plan_type
  -- ❌ FALTA: visivel_landing BOOLEAN
  -- ❌ FALTA: ordem_exibicao INTEGER
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Consequência:
- Erro ao listar planos (query tenta filtrar por campo inexistente)
- Erro ao criar planos (tenta inserir campo inexistente)
- Erro ao duplicar planos
- Lógica de planos vitalícios não funciona

### Solução:
✅ **Migration criada**: `YYYYMMDDHHMMSS_add_plan_type_and_tipo_to_plans.sql`

---

## 🔴 PROBLEMA CRÍTICO 3: Campo `plano_vitalicio` não existe na tabela `profiles`

### Impacto:
**CRÍTICO** - Bloqueia a listagem de personal trainers

### Descrição:
A função RPC `get_personal_trainers_admin_view` tenta selecionar o campo `plano_vitalicio` da tabela `profiles`, mas esse campo **NÃO EXISTE**.

### Localização:
- `supabase/migrations/YYYYMMDDHHMMSS_rpc_function_get_personal_trainers_admin_view.sql` (linha 96)
- `src/pages/admin/PersonalTrainers.tsx` (linhas 132, 177, 368, 374)
- `src/pages/admin/PersonalDetailsPage.tsx` (linhas 103, 249, 264)
- `src/components/admin/AssignPlanToPersonalDialog.tsx` (linha 67)
- `src/components/admin/PersonalFormDialog.tsx` (linha 66)

### Função RPC problemática:
```sql
SELECT
    p.id,
    p.nome,
    -- ... outros campos ...
    p.plano_vitalicio,  -- ❌ CAMPO NÃO EXISTE
    %s AS total_count
FROM
    public.profiles p
```

### Schema SQL atual da tabela profiles:
```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_assinatura TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS data_vencimento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_assinatura public.subscription_status DEFAULT 'pendente'::public.subscription_status,
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS data_desativacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS motivo_desativacao TEXT;
-- ❌ FALTA: plano_vitalicio BOOLEAN
```

### Consequência:
- Erro ao executar a função RPC `get_personal_trainers_admin_view`
- Página de Personal Trainers não carrega
- Erro: "column p.plano_vitalicio does not exist"

### Solução:
✅ **Migration criada**: `YYYYMMDDHHMMSS_add_plano_vitalicio_to_profiles.sql`

---

## 📊 Resumo das Inconsistências

| # | Problema | Tabela/Função | Campo/Função Faltante | Impacto | Status |
|---|----------|---------------|----------------------|---------|--------|
| 1 | Função auxiliar não existe | `get_my_role()` | Função completa | 🔴 CRÍTICO | ✅ Migration criada |
| 2 | Campo tipo não existe | `plans` | `tipo` (ENUM plan_type) | 🔴 CRÍTICO | ✅ Migration criada |
| 3 | Campo visivel_landing não existe | `plans` | `visivel_landing` (BOOLEAN) | 🟡 MÉDIO | ✅ Migration criada |
| 4 | Campo ordem_exibicao não existe | `plans` | `ordem_exibicao` (INTEGER) | 🟡 MÉDIO | ✅ Migration criada |
| 5 | Campo plano_vitalicio não existe | `profiles` | `plano_vitalicio` (BOOLEAN) | 🔴 CRÍTICO | ✅ Migration criada |

---

## 🔧 Migrations Criadas

### 1. `YYYYMMDDHHMMSS_create_get_my_role_function.sql`
Cria a função `get_my_role()` usada pelas políticas RLS.

### 2. `YYYYMMDDHHMMSS_add_plan_type_and_tipo_to_plans.sql`
Adiciona:
- ENUM `plan_type` ('publico', 'vitalicio')
- Campo `tipo` na tabela `plans`
- Campo `visivel_landing` na tabela `plans`
- Campo `ordem_exibicao` na tabela `plans`

### 3. `YYYYMMDDHHMMSS_add_plano_vitalicio_to_profiles.sql`
Adiciona o campo `plano_vitalicio` (BOOLEAN) na tabela `profiles`.

---

## ⚠️ Observações Importantes

### Ordem de Aplicação das Migrations
As migrations devem ser aplicadas na seguinte ordem:
1. `create_get_my_role_function.sql` (PRIMEIRA - resolve RLS)
2. `add_plan_type_and_tipo_to_plans.sql` (SEGUNDA - cria ENUM e campos em plans)
3. `add_plano_vitalicio_to_profiles.sql` (TERCEIRA - depende do ENUM plan_type)
4. `rpc_function_get_personal_stats.sql` (pode ser aplicada a qualquer momento)

### Impacto no Lovable.dev
Após aplicar as migrations no Supabase, o Lovable.dev precisa:
1. Sincronizar com o GitHub (Pull)
2. Regenerar os tipos TypeScript do Supabase
3. Fazer novo deploy

### Dados Existentes
As migrations incluem lógica para atualizar dados existentes:
- Planos com `preco_mensal = 0` serão marcados como `tipo = 'vitalicio'`
- Personal trainers com planos vitalícios terão `plano_vitalicio = TRUE`

---

## 🎯 Próximos Passos

1. ✅ Aplicar migration `create_get_my_role_function.sql` no Supabase SQL Editor
2. ✅ Aplicar migration `add_plan_type_and_tipo_to_plans.sql` no Supabase SQL Editor
3. ✅ Aplicar migration `add_plano_vitalicio_to_profiles.sql` no Supabase SQL Editor
4. ✅ Sincronizar Lovable.dev com GitHub
5. ✅ Testar página de Personal Trainers
6. ✅ Testar página de Planos
7. ✅ Verificar se não há mais erros no console do navegador

