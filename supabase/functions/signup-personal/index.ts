import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { email, password, nome, cref, telefone } = await req.json()

    if (!email || !password || !nome) {
      return new Response(JSON.stringify({ success: false, error: 'Email, senha e nome são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Criar usuário com confirmação automática
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        nome, 
        role: 'personal',
        cref: cref || null,
        telefone: telefone || null
      }
    })

    if (createUserError) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: createUserError.message.includes('already') ? 'Email já cadastrado' : createUserError.message 
      }), {
        status: createUserError.message.includes('already') ? 409 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!newUser.user) {
      return new Response(JSON.stringify({ success: false, error: 'Erro ao criar usuário' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // O trigger handle_new_user deve criar o perfil automaticamente
    // Mas vamos verificar se foi criado e criar manualmente se necessário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', newUser.user.id)
      .single()

    if (profileError || !profile) {
      // Criar perfil manualmente se o trigger falhou
      const { error: insertProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email,
          nome,
          role: 'personal',
          cref: cref || null,
          telefone: telefone || null,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertProfileError) {
        // Se falhou ao criar o perfil, deletar o usuário
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Erro ao criar perfil: ' + insertProfileError.message 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Personal trainer criado com sucesso',
      user: {
        id: newUser.user.id,
        email: newUser.user.email
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Erro interno do servidor: ' + error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
