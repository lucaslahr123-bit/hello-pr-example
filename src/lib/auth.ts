import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PerfilCodigo = "OPERADOR" | "LIDER_TURNO" | "GESTOR" | "ADMIN";

export type UsuarioAtual = {
  id: string;
  nome: string;
  empresaId: string;
  perfil: PerfilCodigo;
  maquinaVinculadaId: string | null;
};

/**
 * Busca o usuário logado (auth + linha em `usuarios`, já com o perfil).
 * Retorna null se não houver sessão ou se o registro em `usuarios`
 * ainda não existir (usuário criado no Auth mas não vinculado).
 */
export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, empresa_id, maquina_vinculada_id, perfis(codigo)")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  const perfil = (
    Array.isArray(data.perfis) ? data.perfis[0] : data.perfis
  ) as { codigo: PerfilCodigo } | null;

  if (!perfil) return null;

  return {
    id: data.id,
    nome: data.nome,
    empresaId: data.empresa_id,
    perfil: perfil.codigo,
    maquinaVinculadaId: data.maquina_vinculada_id,
  };
}

const NIVEL: Record<PerfilCodigo, number> = {
  OPERADOR: 0,
  LIDER_TURNO: 1,
  GESTOR: 2,
  ADMIN: 3,
};

export function temPeloMenos(perfil: PerfilCodigo, minimo: PerfilCodigo) {
  return NIVEL[perfil] >= NIVEL[minimo];
}

/**
 * Barreira de defesa em profundidade para telas restritas a um perfil
 * mínimo — o RLS já bloqueia a escrita no banco, isto aqui só evita que
 * quem não tem o perfil veja a tela ao digitar a URL direto.
 */
export async function exigirPerfil(minimo: PerfilCodigo) {
  const usuario = await getUsuarioAtual();
  if (!usuario || !temPeloMenos(usuario.perfil, minimo)) {
    redirect("/");
  }
  return usuario;
}
