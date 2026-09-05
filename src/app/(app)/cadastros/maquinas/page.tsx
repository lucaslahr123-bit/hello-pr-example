import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

export default async function MaquinasPage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const [{ data: maquinas }, { data: etapas }] = await Promise.all([
    supabase.from("maquinas").select("*, etapas_processo(nome)").order("nome"),
    supabase.from("etapas_processo").select("id, nome").eq("ativo", true).order("ordem"),
  ]);

  const opcoesEtapa = (etapas ?? []).map((e) => ({ value: e.id, label: e.nome }));

  return (
    <CadastroCrud
      tabela="maquinas"
      titulo="Máquinas"
      descricao="Moinho, lavadora, extrusora... cada máquina pertence a uma etapa de processo."
      empresaId={usuario.empresaId}
      registrosIniciais={maquinas ?? []}
      selecao="*, etapas_processo(nome)"
      colunas={[
        { chave: "nome", titulo: "Nome" },
        { chave: "etapa_id", titulo: "Etapa", caminho: "etapas_processo.nome" },
        { chave: "capacidade_nominal_kg_h", titulo: "Capacidade (kg/h)" },
      ]}
      campos={[
        { key: "nome", label: "Nome", tipo: "text", obrigatorio: true },
        { key: "etapa_id", label: "Etapa de processo", tipo: "select", opcoes: opcoesEtapa, obrigatorio: true },
        { key: "capacidade_nominal_kg_h", label: "Capacidade nominal (kg/h)", tipo: "number" },
      ]}
    />
  );
}
