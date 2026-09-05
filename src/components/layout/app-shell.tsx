"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, Recycle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemNav } from "./nav-config";
import { Button } from "@/components/ui/button";

export function AppShell({
  itens,
  nomeUsuario,
  perfilLabel,
  onSair,
  children,
}: {
  itens: ItemNav[];
  nomeUsuario: string;
  perfilLabel: string;
  onSair: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [abertoMobile, setAbertoMobile] = React.useState(false);

  const navConteudo = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {itens.map((item) => {
        const ativo = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setAbertoMobile(false)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium",
              ativo
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-100",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-neutral-50">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-4">
          <Recycle className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-semibold">Produção & Estoque</span>
        </div>
        {navConteudo}
        <RodapeUsuario nome={nomeUsuario} perfil={perfilLabel} onSair={onSair} />
      </aside>

      {/* Sidebar — mobile (slide-over) */}
      {abertoMobile && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setAbertoMobile(false)}
          />
          <aside className="relative z-50 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4">
              <span className="text-sm font-semibold">Produção & Estoque</span>
              <button onClick={() => setAbertoMobile(false)} aria-label="Fechar menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {navConteudo}
            <RodapeUsuario nome={nomeUsuario} perfil={perfilLabel} onSair={onSair} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
          <button onClick={() => setAbertoMobile(true)} aria-label="Abrir menu">
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-sm font-semibold">Produção & Estoque</span>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function RodapeUsuario({
  nome,
  perfil,
  onSair,
}: {
  nome: string;
  perfil: string;
  onSair: () => void;
}) {
  return (
    <div className="border-t border-neutral-200 p-3">
      <div className="mb-2 px-1">
        <p className="truncate text-sm font-medium text-neutral-900">{nome}</p>
        <p className="text-xs text-neutral-500">{perfil}</p>
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={onSair}>
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}
