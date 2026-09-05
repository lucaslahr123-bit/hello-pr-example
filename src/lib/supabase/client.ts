import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components.
 * Usa a chave anônima — a segurança de acesso vem do RLS no banco.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
