import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, nome, telefone, data_nascimento, objetivo, observacoes } = await req.json();

    // Initialize Supabase client with service role key for admin actions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify personal trainer authentication and role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: personalUser }, error: authError } = await supabaseAdmin.auth.admin.getUser(token);

    if (authError || !personalUser) {
      return new Response(JSON.stringify({ success: false, error: authError?.message || 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch personal's profile to confirm role
    const { data: personalProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', personalUser.id)
      .single();

    if (profileError || personalProfile?.role !== 'personal') {
      return new Response(JSON.stringify({ success: false, error: 'Acesso negado: apenas personal trainers podem criar alunos' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate a temporary password
    const temp_password = 'Atrenis' + Math.floor(Math.random() * 10000).toString();

    // Create user in auth.users
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: temp_password,
      email_confirm: true, // Automatically confirm email
      user_metadata: {
        nome: nome,
        role: 'aluno',
        telefone: telefone,
        data_nascimento: data_nascimento,
        objetivo: objetivo,
        observacoes_aluno: observacoes,
      },
    });

    if (createUserError) {
      if (createUserError.message.includes('duplicate key value violates unique constraint "users_email_key"')) {
        return new Response(JSON.stringify({ success: false, error: 'Email já cadastrado no sistema' }), {
          status: 409, // Conflict
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw createUserError;
    }

    // Insert profile data into public.profiles
    const { error: insertProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user!.id,
        email: email,
        nome: nome,
        role: 'aluno',
        personal_id: personalProfile.id,
        telefone: telefone,
        data_nascimento: data_nascimento,
        objetivo: objetivo,
        observacoes_aluno: observacoes,
      });

    if (insertProfileError) {
      // If profile insertion fails, consider rolling back user creation (optional, more complex)
      console.error('Error inserting profile:', insertProfileError);
      return new Response(JSON.stringify({ success: false, error: 'Erro ao criar perfil do aluno.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      aluno_id: newUser.user!.id,
      email: email,
      temp_password: temp_password,
      message: 'Aluno criado com sucesso. Forneça a senha temporária ao aluno.',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Edge Function error:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});