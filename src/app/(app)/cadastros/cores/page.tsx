import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

export default async function CoresPage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const { data } = await supabase.from("cores").select("*").order("nome");

  return (
    <CadastroCrud
      tabela="cores"
      titulo="Cores"
      descricao="Cor do material (natural, branco, preto, colorido/misto...)."
      empresaId={usuario.empresaId}
      registrosIniciais={data ?? []}
      colunas={[{ chave: "nome", titulo: "Nome" }]}
      campos={[{ key: "nome", label: "Nome", tipo: "text", obrigatorio: true }]}
    />
  );
}
