import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

export default async function TurnosPage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const { data } = await supabase.from("turnos").select("*").order("nome");

  return (
    <CadastroCrud
      tabela="turnos"
      titulo="Turnos"
      descricao="Turno 1, turno 2... usados na abertura de ordens de produção."
      empresaId={usuario.empresaId}
      registrosIniciais={data ?? []}
      colunas={[
        { chave: "nome", titulo: "Nome" },
        { chave: "hora_inicio", titulo: "Início" },
        { chave: "hora_fim", titulo: "Fim" },
      ]}
      campos={[
        { key: "nome", label: "Nome", tipo: "text", obrigatorio: true },
        { key: "hora_inicio", label: "Hora de início", tipo: "time" },
        { key: "hora_fim", label: "Hora de fim", tipo: "time" },
      ]}
    />
  );
}
