# ✅ SCRIPT CORRIGIDO - Erro de Tipo UUID Resolvido

## 🔍 Problema Identificado:

O erro "column 'personal_id' is of type uuid but expression is of type text" ocorreu porque o PostgreSQL estava interpretando os valores `NULL` como `TEXT` em vez de `UUID` na inserção dos exercícios de exemplo.

## ✅ Correção Aplicada:

Adicionei cast explícito `::UUID` para os valores `NULL` na coluna `personal_id`:

```sql
-- ANTES (causava erro):
(NULL, 'Agachamento Livre', ...)

-- DEPOIS (corrigido):
(NULL::UUID, 'Agachamento Livre', ...)
```

## 🚀 **Como Executar o Script Corrigido:**

### **Via Supabase Dashboard:**
1. Acesse **Supabase Dashboard** → **SQL Editor**
2. Copie **TODO** o conteúdo do arquivo: `supabase/migrations/YYYYMMDDHHMMSS_ensure_exercicios_structure.sql`
3. Cole no SQL Editor
4. Clique em **"Run"**

### **Via Supabase CLI:**
```bash
npx supabase db push
```

## 🧪 **Após Executar:**

1. **Recarregue a página** (Ctrl + F5)
2. **Acesse Treinos** → **Criar Novo Treino** → **Etapa 2** → **"Criar Novo"**
3. **Preencha o formulário:**
   - **Nome do Exercício**: "Supino Reto" (obrigatório)
   - **Grupo Muscular**: "Peito" (obrigatório)
   - **Descrição**: "Como executar você sabe" (opcional)
   - **Equipamento**: "Barra" (opcional)
   - **Dificuldade**: "Intermediário" (opcional)
   - **URL do Vídeo**: "https://youtube.com/watch?v=..." (opcional)
   - **URL da Imagem**: "https://exemplo.com/imagem.jpg" (opcional)
4. ✅ **Clique em "Criar Exercício"** - deve funcionar perfeitamente!

## 📋 **O que o Script Corrigido Faz:**

- ✅ **Corrige erro de tipo UUID** com cast explícito
- ✅ **Preserva todos os dados existentes**
- ✅ **Adiciona coluna `publico`** (faltava)
- ✅ **Renomeia `criado_por_personal_id` para `personal_id`**
- ✅ **Configura políticas RLS**
- ✅ **Cria RPC function `search_exercicios`**
- ✅ **Insere exercícios de exemplo** (se tabela vazia)

## 🔧 **Se Ainda Houver Problemas:**

1. **Verifique os logs** no Supabase Dashboard
2. **Confirme que a função foi recriada** executando: `SELECT * FROM search_exercicios();`
3. **Confirme que as colunas** foram adicionadas na aba "Table Editor"
4. **Me informe** o erro específico

---

**O script está corrigido e deve funcionar perfeitamente! Execute e teste!** 🎉
