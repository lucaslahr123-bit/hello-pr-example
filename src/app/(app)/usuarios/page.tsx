import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UsuariosClient } from "./usuarios-client";

export default async function UsuariosPage() {
  await exigirPerfil("ADMIN");
  const supabase = await createClient();

  const [{ data: usuarios }, { data: perfis }, { data: maquinas }] = await Promise.all([
    supabase
      .from("usuarios")
      .select("*, perfis(codigo, nome_exibicao), maquinas(nome)")
      .order("nome"),
    supabase.from("perfis").select("id, codigo, nome_exibicao").order("nome_exibicao"),
    supabase.from("maquinas").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  return (
    <UsuariosClient
      usuariosIniciais={usuarios ?? []}
      perfis={perfis ?? []}
      maquinas={maquinas ?? []}
    />
  );
}
