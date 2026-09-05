import { exigirPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CadastroCrud } from "@/components/cadastros/cadastro-crud";

export default async function ParceirosPage() {
  const usuario = await exigirPerfil("ADMIN");
  const supabase = await createClient();
  const { data } = await supabase.from("parceiros").select("*").order("nome");

  return (
    <CadastroCrud
      tabela="parceiros"
      titulo="Parceiros"
      descricao="Fornecedores, clientes, proprietários de material de terceiro e transportadoras — a mesma empresa pode ser mais de um papel ao mesmo tempo."
      empresaId={usuario.empresaId}
      registrosIniciais={data ?? []}
      colunas={[
        { chave: "nome", titulo: "Nome" },
        { chave: "documento", titulo: "Documento" },
        {
          chave: "eh_fornecedor",
          titulo: "Papéis",
          multiBooleano: [
            { campo: "eh_fornecedor", rotulo: "Fornecedor" },
            { campo: "eh_cliente", rotulo: "Cliente" },
            { campo: "eh_proprietario_terceiro", rotulo: "Proprietário terceiro" },
            { campo: "eh_transportadora", rotulo: "Transportadora" },
          ],
        },
      ]}
      campos={[
        { key: "nome", label: "Nome", tipo: "text", obrigatorio: true },
        { key: "documento", label: "Documento (CNPJ/CPF)", tipo: "text" },
        { key: "eh_fornecedor", label: "É fornecedor", tipo: "boolean" },
        { key: "eh_cliente", label: "É cliente", tipo: "boolean" },
        { key: "eh_proprietario_terceiro", label: "É proprietário de material de terceiro (tolling)", tipo: "boolean" },
        { key: "eh_transportadora", label: "É transportadora", tipo: "boolean" },
      ]}
    />
  );
}
