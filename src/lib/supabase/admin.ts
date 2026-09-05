import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente com a service role key — ignora RLS e pode usar a Admin API
 * de autenticação (criar usuário, etc.). NUNCA importe isto num
 * Client Component; a diretiva `server-only` faz o build falhar se
 * alguém tentar.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
