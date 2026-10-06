import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabaseAuthError(error, fallback) {
  const message = String(error?.message || '').toLowerCase();

  if (message.includes('invalid login credentials')) return 'El correo o la contraseña no son correctos.';
  if (message.includes('email not confirmed')) return 'Confirmá tu correo antes de iniciar sesión.';
  if (message.includes('user already registered')) return 'Ya existe una cuenta con ese correo.';
  if (message.includes('password should be at least')) return 'La contraseña debe tener al menos 8 caracteres.';
  if (message.includes('rate limit')) return 'Hubo demasiados intentos. Esperá un momento y volvé a probar.';
  if (message.includes('fetch') || message.includes('network')) return 'No se pudo conectar con Supabase. Revisá la conexión e intentá de nuevo.';

  return error?.message || fallback;
}
