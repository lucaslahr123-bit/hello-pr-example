import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

const OPCOES_ESTAGIO = [
  { value: "MP", label: "MP — Matéria-prima" },
  { value: "WIP", label: "WIP — Em processo" },
  { value: "PA", label: "PA — Produto acabado" },
  { value: "INSUMO", label: "Insumo" },
  { value: "EMBALAGEM", label: "Embalagem" },
];

export default async function MateriaisPage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const [{ data: materiais }, { data: tipos }, { data: cores }] = await Promise.all([
    supabase
      .from("materiais")
      .select("*, tipos_polimero(nome), cores(nome)")
      .order("nome"),
    supabase.from("tipos_polimero").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("cores").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  const opcoesTipo = (tipos ?? []).map((t) => ({ value: t.id, label: t.nome }));
  const opcoesCor = (cores ?? []).map((c) => ({ value: c.id, label: c.nome }));

  return (
    <CadastroCrud
      tabela="materiais"
      titulo="Materiais"
      descricao="Combinação de polímero + cor + estágio. Ex.: Fardo PEAD Natural (MP), Grão PP Natural (PA)."
      empresaId={usuario.empresaId}
      registrosIniciais={materiais ?? []}
      selecao="*, tipos_polimero(nome), cores(nome)"
      colunas={[
        { chave: "nome", titulo: "Nome" },
        { chave: "tipo_polimero_id", titulo: "Polímero", caminho: "tipos_polimero.nome" },
        { chave: "cor_id", titulo: "Cor", caminho: "cores.nome" },
        {
          chave: "estagio",
          titulo: "Estágio",
          mapaValores: Object.fromEntries(OPCOES_ESTAGIO.map((o) => [o.value, o.label])),
        },
        { chave: "estoque_minimo_kg", titulo: "Estoque mínimo (kg)" },
      ]}
      campos={[
        { key: "nome", label: "Nome", tipo: "text", obrigatorio: true },
        { key: "tipo_polimero_id", label: "Tipo de polímero", tipo: "select", opcoes: opcoesTipo, obrigatorio: true },
        { key: "cor_id", label: "Cor", tipo: "select", opcoes: opcoesCor },
        { key: "estagio", label: "Estágio", tipo: "select", opcoes: OPCOES_ESTAGIO, obrigatorio: true },
        { key: "estoque_minimo_kg", label: "Estoque mínimo (kg)", tipo: "number" },
      ]}
    />
  );
}
