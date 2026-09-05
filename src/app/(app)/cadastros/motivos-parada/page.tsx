import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

export default async function MotivosParadaPage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const { data } = await supabase.from("motivos_parada").select("*").order("nome");

  return (
    <CadastroCrud
      tabela="motivos_parada"
      titulo="Motivos de parada"
      descricao="Usados no registro de paradas de máquina durante a OP."
      empresaId={usuario.empresaId}
      registrosIniciais={data ?? []}
      colunas={[{ chave: "nome", titulo: "Nome" }]}
      campos={[{ key: "nome", label: "Nome", tipo: "text", obrigatorio: true }]}
    />
  );
}
