import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

export default async function ParametrosProcessoPage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const [{ data: parametros }, { data: materiais }, { data: etapas }] = await Promise.all([
    supabase
      .from("parametros_processo")
      .select("*, materiais(nome), etapas_processo(nome)"),
    supabase.from("materiais").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("etapas_processo").select("id, nome").eq("ativo", true).order("ordem"),
  ]);

  const opcoesMaterial = (materiais ?? []).map((m) => ({ value: m.id, label: m.nome }));
  const opcoesEtapa = (etapas ?? []).map((e) => ({ value: e.id, label: e.nome }));

  return (
    <CadastroCrud
      tabela="parametros_processo"
      titulo="Parâmetros de processo"
      descricao="Para cada combinação de material + etapa: faixa de perda esperada, rendimento alvo e capacidade. Se não existir, a OP fecha normalmente, sem alerta."
      empresaId={usuario.empresaId}
      registrosIniciais={parametros ?? []}
      ordenarPor="material_id"
      selecao="*, materiais(nome), etapas_processo(nome)"
      colunas={[
        {
          chave: "material_id",
          titulo: "Material",
          formatar: (r) => (r as { materiais?: { nome: string } }).materiais?.nome ?? "—",
        },
        {
          chave: "etapa_id",
          titulo: "Etapa",
          formatar: (r) => (r as { etapas_processo?: { nome: string } }).etapas_processo?.nome ?? "—",
        },
        { chave: "perda_min_pct", titulo: "Perda mín. (%)" },
        { chave: "perda_max_pct", titulo: "Perda máx. (%)" },
        { chave: "rendimento_alvo_pct", titulo: "Rendimento alvo (%)" },
        { chave: "capacidade_kg_h", titulo: "Capacidade (kg/h)" },
      ]}
      campos={[
        { key: "material_id", label: "Material", tipo: "select", opcoes: opcoesMaterial, obrigatorio: true },
        { key: "etapa_id", label: "Etapa de processo", tipo: "select", opcoes: opcoesEtapa, obrigatorio: true },
        { key: "perda_min_pct", label: "Perda mínima esperada (%)", tipo: "number", obrigatorio: true },
        { key: "perda_max_pct", label: "Perda máxima esperada (%)", tipo: "number", obrigatorio: true },
        { key: "rendimento_alvo_pct", label: "Rendimento alvo (%)", tipo: "number" },
        { key: "capacidade_kg_h", label: "Capacidade esperada (kg/h)", tipo: "number" },
      ]}
    />
  );
}
