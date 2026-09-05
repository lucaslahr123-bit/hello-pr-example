import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

export default async function TiposPolimeroPage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const { data } = await supabase.from("tipos_polimero").select("*").order("nome");

  return (
    <CadastroCrud
      tabela="tipos_polimero"
      titulo="Tipos de polímero"
      descricao="PEAD, PEBD, PP, PET, PS, PVC... cadastre os que a operação usar."
      empresaId={usuario.empresaId}
      registrosIniciais={data ?? []}
      colunas={[{ chave: "nome", titulo: "Nome" }]}
      campos={[{ key: "nome", label: "Nome", tipo: "text", obrigatorio: true }]}
    />
  );
}
