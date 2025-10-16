# Instruções de Correção - Atrenis

## Problemas Identificados

1. **Personal Trainers:** Erro `invalid input syntax for type uuid: "none"`
2. **Planos:** Página em branco com erro 400

## Causa Raiz

A função `get_personal_trainers_admin_view` no banco de dados está definida com o parâmetro `plan_filter` como tipo `UUID`, mas o código TypeScript está enviando strings como `"none"` e `"all"`, causando erro de conversão.

## Solução

Execute o script SQL `CORRECAO_COMPLETA.sql` no Supabase SQL Editor.

## Passo a Passo

### 1. Acesse o Supabase SQL Editor

1. Vá para: https://supabase.com/dashboard/project/okzgwxboyibsfdncwmpn/sql/new
2. Faça login se necessário

### 2. Execute o Script SQL

1. Abra o arquivo `CORRECAO_COMPLETA.sql` (está no repositório)
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### 3. Verifique o Resultado

Você deve ver uma mensagem de sucesso indicando que a função foi criada/atualizada.

### 4. Teste a Aplicação

1. Volte para a aplicação: https://atrenis.lovable.app
2. Faça login
3. Acesse **Personal Trainers** no menu lateral
4. Acesse **Planos** no menu lateral

Ambas as páginas devem carregar corretamente agora.

## O Que Foi Corrigido

### Função `get_personal_trainers_admin_view`

**Antes:**
```sql
plan_filter UUID DEFAULT NULL
```

**Depois:**
```sql
plan_filter TEXT DEFAULT NULL
```

**Lógica de Filtro Melhorada:**
- Se `plan_filter` = `"none"` → filtra personal trainers SEM plano
- Se `plan_filter` = `"all"` ou `NULL` → retorna TODOS
- Se `plan_filter` = UUID válido → filtra por plano específico
- Se `plan_filter` = valor inválido → ignora o filtro

**Campos Retornados (17 no total):**
1. id
2. nome
3. email
4. cref
5. plan_id
6. plan_nome
7. plan_max_alunos
8. desconto_percentual
9. data_assinatura
10. data_vencimento
11. status_assinatura
12. total_alunos
13. created_at
14. **ativo** ✓
15. **data_desativacao** ✓
16. **motivo_desativacao** ✓
17. **plano_vitalicio** ✓
18. total_count

## Verificação de Outras Funções

Todas as outras funções RPC foram verificadas e **não apresentam o mesmo problema**.

## Arquivos Criados

1. `CORRECAO_COMPLETA.sql` - Script SQL de correção
2. `INSTRUCOES_CORRECAO_FINAL.md` - Este documento
3. `RELATORIO_CORRECAO.md` - Relatório detalhado da análise

## Suporte

Se após executar o script os erros persistirem, verifique:

1. **Console do navegador** (F12) para ver mensagens de erro detalhadas
2. **Logs do Supabase** na aba Logs do dashboard
3. **Permissões RLS** na tabela `profiles` e `plans`

## Histórico de Tentativas

- ✗ Tentativa 1: Corrigir apenas os campos faltantes (não resolveu o problema do UUID)
- ✓ Tentativa 2: Mudar `plan_filter` de UUID para TEXT + tratamento de exceção

