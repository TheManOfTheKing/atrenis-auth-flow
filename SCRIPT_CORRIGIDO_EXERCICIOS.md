# ✅ SCRIPT CORRIGIDO - Apenas Adicionar Colunas Faltantes

## 🔍 Problema Identificado:

A tabela `exercicios` **já existe e tem dados**, mas está faltando algumas colunas necessárias para o código funcionar.

## ✅ Solução Aplicada:

Criei um script que **apenas adiciona as colunas faltantes** sem tentar recriar a tabela:

### **O que o script faz:**
- ✅ **Adiciona apenas colunas faltantes** com `ADD COLUMN IF NOT EXISTS`
- ✅ **Preserva todos os dados existentes**
- ✅ **Não tenta recriar a tabela**
- ✅ **Configura políticas RLS**
- ✅ **Cria a RPC function `search_exercicios`**

## 🚀 **Como Executar:**

### **Via Supabase Dashboard:**
1. Acesse **Supabase Dashboard** → **SQL Editor**
2. Copie **TODO** o conteúdo do arquivo: `supabase/migrations/YYYYMMDDHHMMSS_add_missing_columns_only.sql`
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
   - Nome: "Supino Reto"
   - Grupo Muscular: "Peito"
   - Descrição: "Como executar você sabe"
   - Equipamento: "Barra"
   - Dificuldade: "Intermediário"
   - URLs: opcionais
4. ✅ **Clique em "Criar Exercício"** - deve funcionar perfeitamente!

## 📋 **Colunas que serão adicionadas:**

- ✅ `personal_id` - ID do personal trainer que criou o exercício
- ✅ `equipamento` - Equipamento necessário
- ✅ `dificuldade` - Nível de dificuldade (Iniciante, Intermediário, Avançado)
- ✅ `imagem_url` - URL da imagem ilustrativa
- ✅ `publico` - Se é exercício público ou privado
- ✅ `grupo_muscular` - Grupo muscular (se não existir)
- ✅ `descricao` - Descrição do exercício (se não existir)
- ✅ `video_url` - URL do vídeo (se não existir)
- ✅ `created_at` e `updated_at` - Timestamps (se não existirem)

## 🔧 **Se Ainda Houver Problemas:**

1. **Verifique os logs** no Supabase Dashboard
2. **Confirme que as colunas** foram adicionadas na aba "Table Editor"
3. **Teste a RPC function** executando: `SELECT * FROM search_exercicios();`
4. **Me informe** o erro específico

---

**Este script é seguro e preserva seus dados existentes! Execute e teste!** 🎉
