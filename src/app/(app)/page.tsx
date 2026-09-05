import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PainelPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Painel</h1>
        <p className="text-sm text-neutral-500">
          Produção, estoque e metas chegam aqui a partir da Fase 1/3. Por
          enquanto, use o menu para acessar a Central de Cadastros.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Fase 0 — Fundação</CardTitle>
          <CardDescription>
            Login, perfis de acesso, cadastros básicos e PWA instalável.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-neutral-600">
          Comece cadastrando parceiros, polímeros, cores, materiais,
          etapas de processo, máquinas, turnos, locais de estoque,
          motivos de perda/parada, unidades de embalagem e os parâmetros
          de processo (faixa de perda esperada por material + etapa).
        </CardContent>
      </Card>
    </div>
  );
}
