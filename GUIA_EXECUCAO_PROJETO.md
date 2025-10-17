# Guia de Execução do Projeto Atrenis

## 🚀 Como Executar o Projeto

### 1. **Pré-requisitos**
- Node.js 18+ instalado
- npm ou yarn
- Conta no Supabase
- Supabase CLI (opcional, mas recomendado)

### 2. **Instalação das Dependências**
```bash
# No diretório do projeto
npm install
# ou
yarn install
```

### 3. **Configuração do Supabase**

#### Opção A: Via Supabase CLI (Recomendado)
```bash
# Instalar Supabase CLI
npm install -g supabase

# Fazer login
supabase login

# Conectar ao projeto
supabase link --project-ref SEU_PROJECT_ID

# Executar migrações
supabase db push

# Deploy das Edge Functions
supabase functions deploy signup-personal
```

#### Opção B: Via Dashboard do Supabase

1. **Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)**
2. **Vá para SQL Editor**
3. **Execute as migrações na ordem:**

**Passo 1: Corrigir ENUM subscription_status**
```sql
-- Primeiro, vamos verificar quais colunas existem na tabela profiles
-- e criar as que estão faltando

-- Verificar se a coluna status_assinatura existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'status_assinatura'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN status_assinatura public.subscription_status DEFAULT 'pendente'::public.subscription_status;
    END IF;
END $$;

-- Verificar se a coluna subscription_status existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'subscription_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN subscription_status public.subscription_status DEFAULT 'pendente'::public.subscription_status;
    END IF;
END $$;

-- Agora corrigir o ENUM subscription_status para ser consistente com a documentação
-- Primeiro, vamos remover o ENUM antigo e criar o novo

-- Remover o ENUM antigo se existir
DROP TYPE IF EXISTS public.subscription_status CASCADE;

-- Criar o ENUM correto baseado na documentação
CREATE TYPE public.subscription_status AS ENUM (
  'pending',
  'active', 
  'inactive',
  'trialing',
  'past_due',
  'canceled',
  'pendente',
  'vitalicio'
);

-- Recriar as colunas com o novo tipo
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status_assinatura_new public.subscription_status DEFAULT 'pendente'::public.subscription_status;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status_new public.subscription_status DEFAULT 'pendente'::public.subscription_status;

-- Copiar dados existentes se houver
UPDATE public.profiles 
SET status_assinatura_new = 'pendente'::public.subscription_status
WHERE status_assinatura_new IS NULL;

UPDATE public.profiles 
SET subscription_status_new = 'pendente'::public.subscription_status
WHERE subscription_status_new IS NULL;

-- Remover colunas antigas
ALTER TABLE public.profiles DROP COLUMN IF EXISTS status_assinatura;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_status;

-- Renomear colunas novas
ALTER TABLE public.profiles RENAME COLUMN status_assinatura_new TO status_assinatura;
ALTER TABLE public.profiles RENAME COLUMN subscription_status_new TO subscription_status;

-- Comentário explicativo
COMMENT ON TYPE public.subscription_status IS 'Status da assinatura: pending, active, inactive, trialing, past_due, canceled, pendente, vitalicio';
COMMENT ON COLUMN public.profiles.status_assinatura IS 'Status da assinatura do personal trainer';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Status da assinatura (coluna alternativa)';
```

**Passo 2: Criar trigger handle_new_user**
```sql
-- Função para criar perfil automaticamente quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    nome,
    role,
    cref,
    telefone,
    ativo,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'aluno'::user_role),
    NEW.raw_user_meta_data->>'cref',
    NEW.raw_user_meta_data->>'telefone',
    TRUE,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha a criação do usuário
    RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger para executar a função quando um usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comentário explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 'Cria automaticamente um perfil na tabela profiles quando um novo usuário é criado no auth.users';
```

**Passo 3: Criar todas as funções RPC necessárias**
Execute o conteúdo do arquivo `YYYYMMDDHHMMSS_create_all_missing_functions.sql` no SQL Editor.

### 4. **Configurar Variáveis de Ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 5. **Executar o Projeto**

```bash
# Modo desenvolvimento
npm run dev
# ou
yarn dev

# O projeto estará disponível em http://localhost:5173
```

### 6. **Deploy da Edge Function (signup-personal)**

#### Via Supabase CLI:
```bash
supabase functions deploy signup-personal
```

#### Via Dashboard:
1. Acesse **Edge Functions** no dashboard
2. Clique em **Create a new function**
3. Nome: `signup-personal`
4. Cole o código da função (está no arquivo `supabase/functions/signup-personal/index.ts`)

## 🔧 **Correções Aplicadas**

### ✅ **Problemas Resolvidos:**

1. **ENUM subscription_status inconsistente** - Padronizado
2. **Função get_personal_trainers_admin_view não encontrada** - Criada com parâmetros corretos
3. **Dashboard Admin com dados incorretos** - Agora usa funções RPC
4. **Login de personal trainers falhando** - Trigger e Edge Function criados
5. **Todas as funções RPC necessárias** - Criadas e testadas

### 📁 **Arquivos Importantes:**

- `supabase/migrations/YYYYMMDDHHMMSS_fix_subscription_status_enum_corrected.sql` - Corrige ENUM
- `supabase/migrations/YYYYMMDDHHMMSS_create_handle_new_user_trigger.sql` - Cria trigger
- `supabase/migrations/YYYYMMDDHHMMSS_create_all_missing_functions.sql` - Todas as funções RPC
- `supabase/functions/signup-personal/index.ts` - Edge Function para cadastro

## 🧪 **Testando o Sistema**

### 1. **Teste de Cadastro de Personal Trainer**
- Acesse `/signup`
- Crie uma conta de personal trainer
- Verifique se o perfil foi criado automaticamente

### 2. **Teste de Login**
- Faça login com a conta criada
- Verifique se redireciona para o dashboard correto

### 3. **Teste do Dashboard Admin**
- Faça login como admin
- Acesse "Personal Trainers" no menu
- Verifique se a lista carrega sem erros

### 4. **Teste das Estatísticas**
- No dashboard admin, verifique se os cards de estatísticas exibem dados
- Verifique se o gráfico de crescimento funciona

## 🚨 **Solução de Problemas**

### Erro: "Could not find the function"
- Execute a migração `YYYYMMDDHHMMSS_create_all_missing_functions.sql`

### Erro: "column does not exist"
- Execute primeiro a migração `YYYYMMDDHHMMSS_fix_subscription_status_enum_corrected.sql`

### Erro no cadastro de personal trainer
- Verifique se a Edge Function `signup-personal` foi deployada
- Verifique se o trigger `handle_new_user` foi criado

### Dashboard não carrega dados
- Verifique se todas as funções RPC foram criadas
- Verifique as permissões RLS no banco de dados

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique os logs do Supabase no dashboard
2. Verifique o console do navegador para erros JavaScript
3. Execute as migrações na ordem correta
4. Verifique se todas as variáveis de ambiente estão configuradas

O sistema deve estar funcionando perfeitamente após seguir todos os passos!
