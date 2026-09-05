import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

export default async function EtapasProcessoPage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const { data } = await supabase
    .from("etapas_processo")
    .select("*")
    .order("ordem");

  return (
    <CadastroCrud
      tabela="etapas_processo"
      titulo="Etapas de processo"
      descricao="Triagem, moagem, lavagem/secagem, extrusão/granulação, ensacamento... a ordem define a sequência do fluxo."
      empresaId={usuario.empresaId}
      registrosIniciais={data ?? []}
      ordenarPor="ordem"
      colunas={[
        { chave: "nome", titulo: "Nome" },
        { chave: "ordem", titulo: "Ordem" },
        {
          chave: "gera_perda",
          titulo: "Gera perda?",
          formatar: (r) => (r.gera_perda ? "Sim" : "Não"),
        },
      ]}
      campos={[
        { key: "nome", label: "Nome", tipo: "text", obrigatorio: true },
        { key: "ordem", label: "Ordem no fluxo", tipo: "number", obrigatorio: true },
        { key: "gera_perda", label: "Etapa gera perda", tipo: "boolean" },
      ]}
    />
  );
}
