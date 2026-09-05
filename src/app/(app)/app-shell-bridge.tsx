"use client";

import { AppShell } from "@/components/layout/app-shell";
import type { ItemNav } from "@/components/layout/nav-config";
import { sair } from "./actions";

/**
 * Pequena ponte client-side: o layout em si é Server Component (para
 * poder buscar o usuário logado com RLS), mas o AppShell precisa de
 * `usePathname` e de um handler de clique para o logout.
 */
export function AppShellServerBridge({
  itens,
  nomeUsuario,
  perfilLabel,
  children,
}: {
  itens: ItemNav[];
  nomeUsuario: string;
  perfilLabel: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell
      itens={itens}
      nomeUsuario={nomeUsuario}
      perfilLabel={perfilLabel}
      onSair={() => sair()}
    >
      {children}
    </AppShell>
  );
}
