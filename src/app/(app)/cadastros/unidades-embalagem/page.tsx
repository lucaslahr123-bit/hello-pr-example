import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

export default async function UnidadesEmbalagemPage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const { data } = await supabase.from("unidades_embalagem").select("*").order("nome");

  return (
    <CadastroCrud
      tabela="unidades_embalagem"
      titulo="Unidades de embalagem"
      descricao="Big bag, saco, fardo... o fator em kg é só referência — a pesagem real sempre prevalece."
      empresaId={usuario.empresaId}
      registrosIniciais={data ?? []}
      colunas={[
        { chave: "nome", titulo: "Nome" },
        { chave: "fator_kg", titulo: "Fator (kg)" },
      ]}
      campos={[
        { key: "nome", label: "Nome", tipo: "text", obrigatorio: true },
        { key: "fator_kg", label: "Fator de referência (kg)", tipo: "number" },
      ]}
    />
  );
}
