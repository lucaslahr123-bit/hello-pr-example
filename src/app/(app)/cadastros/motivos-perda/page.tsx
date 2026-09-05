import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

export default async function MotivosPerdaPage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const { data } = await supabase.from("motivos_perda").select("*").order("nome");

  return (
    <CadastroCrud
      tabela="motivos_perda"
      titulo="Motivos de perda"
      descricao="Usados na classificação obrigatória de perda ao fechar uma ordem de produção."
      empresaId={usuario.empresaId}
      registrosIniciais={data ?? []}
      colunas={[{ chave: "nome", titulo: "Nome" }]}
      campos={[{ key: "nome", label: "Nome", tipo: "text", obrigatorio: true }]}
    />
  );
}
