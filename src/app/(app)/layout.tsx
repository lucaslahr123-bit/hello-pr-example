import { getUsuarioAtual, temPeloMenos } from "@/lib/auth";
import { NAV_PRINCIPAL } from "@/components/layout/nav-config";
import { AppShellServerBridge } from "./app-shell-bridge";

const LABEL_PERFIL: Record<string, string> = {
  OPERADOR: "Operador",
  LIDER_TURNO: "Líder de turno",
  GESTOR: "Gestor",
  ADMIN: "Administrador",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioAtual();

  if (!usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
        <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-amber-900">
            Conta sem acesso vinculado
          </h1>
          <p className="text-sm text-amber-800">
            Seu login existe, mas ainda não há um registro em{" "}
            <code>usuarios</code> vinculando você a um perfil e a uma
            empresa. Peça para um administrador te cadastrar, ou veja o
            passo de bootstrap no README.
          </p>
        </div>
      </main>
    );
  }

  const itens = NAV_PRINCIPAL.filter((item) =>
    temPeloMenos(usuario.perfil, item.minimo),
  );

  return (
    <AppShellServerBridge
      itens={itens}
      nomeUsuario={usuario.nome}
      perfilLabel={LABEL_PERFIL[usuario.perfil] ?? usuario.perfil}
    >
      {children}
    </AppShellServerBridge>
  );
}
