# Correções Realizadas nas Dashboards

## Data: 16/10/2025

### Problema 1: Dashboard do Personal Trainer - Página de Alunos não carrega

**Erro**: `Could not embed because more than one relationship was found for 'profiles' and 'aluno_treinos'`

**Causa**: A tabela `aluno_treinos` possui dois relacionamentos com `profiles`:
- `aluno_id` → `profiles.id`
- `personal_id` → `profiles.id`

Quando fazemos a query `aluno_treinos(count)`, o Supabase não sabe qual relacionamento usar, causando ambiguidade.

**Solução Aplicada**:
- **Arquivo**: `src/hooks/usePersonalStudents.ts`
- **Linhas**: 42 e 101
- **Mudança**: Alterado de `aluno_treinos(count)` para `aluno_treinos!aluno_id(count)`
- **Explicação**: A sintaxe `!aluno_id` especifica explicitamente que queremos usar o relacionamento através da foreign key `aluno_id`.

### Problema 2: Função RPC get_personal_stats não existe no banco de dados

**Erro**: A dashboard do Personal Trainer chama a função RPC `get_personal_stats` que não existe no banco de dados.

**Causa**: O código TypeScript referencia a função, mas não há migration SQL para criá-la.

**Solução Aplicada**:
- **Arquivo**: `supabase/migrations/YYYYMMDDHHMMSS_rpc_function_get_personal_stats.sql` (CRIADO)
- **Função**: `get_personal_stats(personal_uuid UUID)`
- **Retorna**: 
  - `total_alunos`: Total de alunos do personal
  - `total_treinos`: Total de treinos criados
  - `total_execucoes`: Total de execuções de treinos
  - `execucoes_mes`: Execuções no mês atual

## Arquivos Modificados

1. `src/hooks/usePersonalStudents.ts` - Corrigido relacionamento ambíguo
2. `supabase/migrations/YYYYMMDDHHMMSS_rpc_function_get_personal_stats.sql` - Criada função RPC faltante

## Próximos Passos

1. Fazer commit das alterações
2. Push para o repositório GitHub
3. Aplicar as migrations no banco de dados do Supabase
4. Testar as dashboards novamente

## Observações

- A dashboard do Administrador usa a função RPC `get_personal_trainers_admin_view` que já existe e está funcionando corretamente
- Não foram identificados problemas de relacionamento ambíguo na dashboard do Admin

