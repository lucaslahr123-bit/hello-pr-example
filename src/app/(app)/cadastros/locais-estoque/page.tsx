import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

const OPCOES_TIPO = [
  { value: "GALPAO", label: "Galpão" },
  { value: "AREA", label: "Área" },
  { value: "BOX", label: "Box" },
];

export default async function LocaisEstoquePage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const { data } = await supabase.from("locais_estoque").select("*").order("nome");

  return (
    <CadastroCrud
      tabela="locais_estoque"
      titulo="Locais de estoque"
      descricao="Galpão, área ou box onde os lotes ficam fisicamente guardados."
      empresaId={usuario.empresaId}
      registrosIniciais={data ?? []}
      colunas={[
        { chave: "nome", titulo: "Nome" },
        {
          chave: "tipo",
          titulo: "Tipo",
          formatar: (r) => OPCOES_TIPO.find((o) => o.value === r.tipo)?.label ?? String(r.tipo ?? "—"),
        },
      ]}
      campos={[
        { key: "nome", label: "Nome", tipo: "text", obrigatorio: true },
        { key: "tipo", label: "Tipo", tipo: "select", opcoes: OPCOES_TIPO, obrigatorio: true },
      ]}
    />
  );
}
