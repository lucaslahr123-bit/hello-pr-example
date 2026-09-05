"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoCriarUsuario = { erro?: string; sucesso?: boolean } | undefined;

export async function criarUsuario(
  _estadoAnterior: EstadoCriarUsuario,
  formData: FormData,
): Promise<EstadoCriarUsuario> {
  const usuarioLogado = await exigirPerfil("ADMIN");

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const perfilId = String(formData.get("perfil_id") ?? "");
  const maquinaId = String(formData.get("maquina_vinculada_id") ?? "") || null;

  if (!nome || !email || !senha || !perfilId) {
    return { erro: "Preencha nome, e-mail, senha e perfil." };
  }
  if (senha.length < 6) {
    return { erro: "A senha precisa ter pelo menos 6 caracteres." };
  }

  const admin = createAdminClient();

  const { data: criado, error: erroAuth } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (erroAuth || !criado.user) {
    return { erro: erroAuth?.message ?? "Erro ao criar usuário no Auth." };
  }

  const { error: erroPerfil } = await admin.from("usuarios").insert({
    id: criado.user.id,
    empresa_id: usuarioLogado.empresaId,
    nome,
    perfil_id: perfilId,
    maquina_vinculada_id: maquinaId,
  });

  if (erroPerfil) {
    // desfaz a criação no Auth para não deixar login órfão sem perfil
    await admin.auth.admin.deleteUser(criado.user.id);
    return { erro: erroPerfil.message };
  }

  revalidatePath("/usuarios");
  return { sucesso: true };
}
