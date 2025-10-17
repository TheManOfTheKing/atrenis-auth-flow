# ✅ CORREÇÃO APLICADA - Validação de URLs no Criar Exercício

## 🔍 Problema Identificado:

O erro estava na validação das URLs no schema Zod. Quando os campos `video_url` e `imagem_url` estavam vazios, o Zod estava tentando validar uma string vazia como URL, causando erro.

## ✅ Correção Aplicada:

### **Antes (Problemático):**
```typescript
video_url: z.string()
  .url('URL inválida')  // ❌ Tentava validar string vazia como URL
  .optional()
  .or(z.literal('')),
```

### **Depois (Corrigido):**
```typescript
video_url: z.string()
  .optional()
  .refine((val) => !val || z.string().url().safeParse(val).success, {
    message: 'URL inválida'
  })
  .or(z.literal('')), // ✅ Só valida URL se o campo não estiver vazio
```

## 🧪 **Como Testar Agora:**

### 1. **Teste com campos vazios:**
1. Acesse **Treinos** → **Criar Novo Treino** → **Etapa 2** → **"Criar Novo"**
2. Preencha apenas os campos obrigatórios:
   - **Nome do Exercício**: "Teste"
   - **Grupo Muscular**: "Peito"
3. **Deixe os campos de URL vazios** (não preencha nada)
4. ✅ Clique em **"Criar Exercício"** - deve funcionar sem erro

### 2. **Teste com URLs válidas:**
1. Preencha os campos obrigatórios
2. Adicione uma URL válida:
   - **URL do Vídeo**: "https://youtube.com/watch?v=abc123"
   - **URL da Imagem**: "https://exemplo.com/imagem.jpg"
3. ✅ Clique em **"Criar Exercício"** - deve funcionar

### 3. **Teste com URLs inválidas:**
1. Preencha os campos obrigatórios
2. Adicione uma URL inválida:
   - **URL do Vídeo**: "texto-sem-url"
3. ✅ Deve mostrar erro de validação "URL inválida"

## 📋 **Funcionamento Correto:**

- ✅ **Campos vazios**: Aceita sem erro
- ✅ **URLs válidas**: Aceita e valida corretamente
- ✅ **URLs inválidas**: Rejeita com mensagem de erro
- ✅ **Campos obrigatórios**: Nome e Grupo Muscular continuam obrigatórios

---

**Por favor, teste agora e me confirme se o erro foi resolvido!** 🎉
