import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = 
  !supabaseUrl || 
  supabaseUrl.includes('seu-projeto-id') || 
  !supabaseAnonKey || 
  supabaseAnonKey.includes('cole-sua-chave');

if (isPlaceholder) {
  console.warn(
    '⚠️ CREDENCIAIS DO SUPABASE AUSENTES:\n' +
    'Por favor, configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo "frontend/.env" para conectar a aplicação ao banco de dados em nuvem.\n' +
    'A aplicação continuará rodando com um cliente temporário até as chaves serem inseridas.'
  );
}

// Inicializa o cliente do Supabase (com fallback para evitar travamentos de build/início)
export const supabase = createClient(
  !isPlaceholder ? supabaseUrl : 'https://placeholder-project.supabase.co',
  !isPlaceholder ? supabaseAnonKey : 'placeholder-anon-key'
);
