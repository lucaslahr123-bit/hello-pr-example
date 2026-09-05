import type { PerfilCodigo } from "@/lib/auth";

export type ItemNav = {
  href: string;
  label: string;
  minimo: PerfilCodigo;
};

/**
 * Navegação da área de escritório/gestão. As telas de chão de fábrica
 * (apontamento em tablet) entram na Fase 2 com um layout próprio, mais
 * simples — não aparecem aqui.
 */
export const NAV_PRINCIPAL: ItemNav[] = [
  { href: "/", label: "Painel", minimo: "OPERADOR" },
  { href: "/cadastros/parceiros", label: "Parceiros", minimo: "ADMIN" },
  { href: "/cadastros/tipos-polimero", label: "Tipos de polímero", minimo: "ADMIN" },
  { href: "/cadastros/cores", label: "Cores", minimo: "ADMIN" },
  { href: "/cadastros/materiais", label: "Materiais", minimo: "ADMIN" },
  { href: "/cadastros/etapas-processo", label: "Etapas de processo", minimo: "ADMIN" },
  { href: "/cadastros/maquinas", label: "Máquinas", minimo: "ADMIN" },
  { href: "/cadastros/turnos", label: "Turnos", minimo: "ADMIN" },
  { href: "/cadastros/locais-estoque", label: "Locais de estoque", minimo: "ADMIN" },
  { href: "/cadastros/motivos-perda", label: "Motivos de perda", minimo: "ADMIN" },
  { href: "/cadastros/motivos-parada", label: "Motivos de parada", minimo: "ADMIN" },
  { href: "/cadastros/unidades-embalagem", label: "Unidades de embalagem", minimo: "ADMIN" },
  { href: "/cadastros/parametros-processo", label: "Parâmetros de processo", minimo: "ADMIN" },
  { href: "/usuarios", label: "Usuários", minimo: "ADMIN" },
];
