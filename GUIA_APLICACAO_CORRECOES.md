# Guia de Aplicação das Correções - Dashboard Admin

## ✅ O que foi feito

Realizei uma **revisão completa e aprofundada** da estrutura do banco de dados e do código TypeScript, identificando **3 problemas críticos** que impediam o funcionamento das dashboards do Administrador.

Todos os problemas foram documentados e as migrations SQL necessárias foram criadas e enviadas para o GitHub.

---

## 🔴 Problemas Identificados

### 1. Função `get_my_role()` não existe ⚠️ CRÍTICO
**Impacto**: Bloqueia TODAS as operações do administrador

As políticas RLS (Row Level Security) usam essa função para verificar permissões, mas ela não existe no banco de dados. Resultado: todas as queries do admin são bloqueadas.

### 2. Campo `tipo` não existe na tabela `plans` ⚠️ CRÍTICO
**Impacto**: Impede listagem e criação de planos

O código TypeScript usa o campo `tipo` (ENUM: 'publico' | 'vitalicio') extensivamente, mas ele não existe no banco de dados.

### 3. Campo `plano_vitalicio` não existe na tabela `profiles` ⚠️ CRÍTICO
**Impacto**: Impede listagem de personal trainers

A função RPC `get_personal_trainers_admin_view` tenta selecionar esse campo, mas ele não existe, causando erro na query.

---

## 📋 Passo a Passo para Aplicar as Correções

### PASSO 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login com suas credenciais
3. Selecione o projeto **Atrenis**
4. No menu lateral, clique em **"SQL Editor"**

---

### PASSO 2: Aplicar Migration 1 - Função get_my_role()

**⚠️ IMPORTANTE: Esta deve ser a PRIMEIRA migration aplicada!**

1. No SQL Editor, clique em **"New query"**
2. Copie e cole o seguinte código:

```sql
-- Função auxiliar para obter o role do usuário autenticado
-- Esta função é usada pelas políticas RLS para verificar permissões

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_my_role() IS 'Retorna o role do usuário autenticado atual. Usado pelas políticas RLS.';
```

3. Clique em **"Run"** (ou pressione Ctrl+Enter)
4. Verifique se apareceu a mensagem: **"Success. No rows returned"**

---

### PASSO 3: Aplicar Migration 2 - Campos na tabela plans

1. No SQL Editor, clique em **"New query"** novamente
2. Copie e cole o seguinte código:

```sql
-- Criação do ENUM plan_type (se não existir)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
        CREATE TYPE public.plan_type AS ENUM ('publico', 'vitalicio');
    END IF;
END $$;

-- Adicionar campo tipo à tabela plans
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS tipo public.plan_type DEFAULT 'publico'::public.plan_type;

-- Adicionar campo visivel_landing à tabela plans (usado para exibir planos na landing page)
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS visivel_landing BOOLEAN DEFAULT TRUE;

-- Adicionar campo ordem_exibicao à tabela plans (para ordenar planos na landing page)
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS ordem_exibicao INTEGER DEFAULT 0;

-- Comentários explicativos
COMMENT ON COLUMN public.plans.tipo IS 'Tipo do plano: publico (disponível para assinatura) ou vitalicio (sem data de vencimento)';
COMMENT ON COLUMN public.plans.visivel_landing IS 'Define se o plano é visível na landing page pública';
COMMENT ON COLUMN public.plans.ordem_exibicao IS 'Ordem de exibição do plano na landing page (menor valor = maior prioridade)';

-- Atualizar planos existentes que têm preco_mensal = 0 para serem vitalícios
UPDATE public.plans
SET tipo = 'vitalicio'::public.plan_type
WHERE preco_mensal = 0 OR preco_anual = 0;

-- Planos vitalícios não devem ser visíveis na landing page por padrão
UPDATE public.plans
SET visivel_landing = FALSE
WHERE tipo = 'vitalicio'::public.plan_type;
```

3. Clique em **"Run"** (ou pressione Ctrl+Enter)
4. Verifique se apareceu a mensagem de sucesso

---

### PASSO 4: Aplicar Migration 3 - Campo plano_vitalicio

1. No SQL Editor, clique em **"New query"** novamente
2. Copie e cole o seguinte código:

```sql
-- Adicionar campo plano_vitalicio à tabela profiles
-- Este campo indica se o personal trainer possui um plano vitalício (sem data de vencimento)

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plano_vitalicio BOOLEAN DEFAULT FALSE;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.plano_vitalicio IS 'Indica se o personal trainer possui um plano vitalício (sem data de vencimento)';

-- Atualizar registros existentes que têm planos vitalícios
-- (Se houver algum plano do tipo 'vitalicio', atualizar os personal trainers que o possuem)
UPDATE public.profiles p
SET plano_vitalicio = TRUE
WHERE p.role = 'personal'
  AND p.plan_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM public.plans pl 
    WHERE pl.id = p.plan_id 
      AND pl.tipo = 'vitalicio'
  );
```

3. Clique em **"Run"** (ou pressione Ctrl+Enter)
4. Verifique se apareceu a mensagem de sucesso

---

### PASSO 5: Verificar se as migrations foram aplicadas

Execute a seguinte query para verificar:

```sql
-- Verificar se a função get_my_role existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_my_role';

-- Verificar se os campos foram adicionados em plans
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'plans' 
  AND column_name IN ('tipo', 'visivel_landing', 'ordem_exibicao');

-- Verificar se o campo foi adicionado em profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'plano_vitalicio';
```

Se todos os resultados aparecerem, as migrations foram aplicadas com sucesso! ✅

---

### PASSO 6: Sincronizar Lovable.dev com GitHub

1. Acesse: https://lovable.dev
2. Faça login e abra o projeto **Atrenis**
3. No menu lateral, procure por **"Sync"** ou **"Pull from GitHub"**
4. Clique para sincronizar
5. Aguarde a sincronização completar (pode levar alguns minutos)
6. O Lovable fará o deploy automático após a sincronização

---

### PASSO 7: Testar as Dashboards

#### Testar Dashboard do Administrador:

1. Acesse: https://atrenis.lovable.app/login
2. Faça login com: **delmondesadv@gmail.com** / **123456**
3. Você deve ser redirecionado para `/admin/dashboard`
4. No menu lateral, clique em **"Personal Trainers"**
   - ✅ A lista deve carregar sem erros
   - ✅ Deve mostrar os personal trainers cadastrados
5. No menu lateral, clique em **"Planos"**
   - ✅ A lista deve carregar sem erros
   - ✅ Deve mostrar os planos cadastrados

#### Testar Dashboard do Personal Trainer:

1. Faça logout
2. Faça login com: **decox23@gmail.com** / **123456**
3. No menu lateral, clique em **"Alunos"**
   - ✅ A lista deve carregar sem erros
   - ✅ Deve mostrar os alunos cadastrados com contador de treinos

---

## 🐛 Troubleshooting

### Se a página de Personal Trainers ainda não carregar:

1. **Verifique o console do navegador** (F12 → Console)
   - Se houver erro de "permission denied" ou "RLS policy", verifique se a migration 1 foi aplicada corretamente
   - Se houver erro de "column does not exist", verifique se as migrations 2 e 3 foram aplicadas

2. **Limpe o cache do navegador**
   - Pressione Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)

3. **Verifique se o Lovable sincronizou**
   - Vá no Lovable.dev e confirme que o último commit aparece no histórico

### Se a página de Planos ainda não carregar:

1. **Verifique se há planos cadastrados**
   - Execute no SQL Editor: `SELECT * FROM public.plans;`
   - Se não houver planos, crie um plano de teste

2. **Verifique as políticas RLS**
   - Execute no SQL Editor: `SELECT * FROM pg_policies WHERE tablename = 'plans';`
   - Deve haver políticas permitindo admin ver todos os planos

### Se ainda houver problemas:

1. **Verifique os logs do Supabase**
   - No Supabase Dashboard, vá em "Logs" → "Postgres Logs"
   - Procure por erros relacionados às queries

2. **Verifique o role do usuário admin**
   - Execute: `SELECT id, email, role FROM public.profiles WHERE email = 'delmondesadv@gmail.com';`
   - O role deve ser **'admin'**

---

## 📊 Resumo das Migrations

| # | Arquivo | Descrição | Ordem |
|---|---------|-----------|-------|
| 1 | `YYYYMMDDHHMMSS_create_get_my_role_function.sql` | Cria função auxiliar para RLS | 1º |
| 2 | `YYYYMMDDHHMMSS_add_plan_type_and_tipo_to_plans.sql` | Adiciona campos na tabela plans | 2º |
| 3 | `YYYYMMDDHHMMSS_add_plano_vitalicio_to_profiles.sql` | Adiciona campo na tabela profiles | 3º |

---

## ✅ Checklist Final

- [ ] Migration 1 aplicada (função get_my_role)
- [ ] Migration 2 aplicada (campos em plans)
- [ ] Migration 3 aplicada (campo em profiles)
- [ ] Verificação das migrations executada
- [ ] Lovable.dev sincronizado com GitHub
- [ ] Dashboard do Admin testada (Personal Trainers)
- [ ] Dashboard do Admin testada (Planos)
- [ ] Dashboard do Personal testada (Alunos)
- [ ] Sem erros no console do navegador

---

## 📞 Suporte

Se após seguir todos os passos ainda houver problemas, forneça:
- Screenshot da tela com erro
- Console do navegador (F12 → Console)
- Resultado da query de verificação das migrations
- Logs do Supabase (se disponível)

---

**Commit realizado**: `e76cedb`
**Data**: 16/10/2025
**Arquivos modificados**: 4 novos arquivos (3 migrations + 1 documentação)

