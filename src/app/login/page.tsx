"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const [estado, formAction, pendente] = useActionState<EstadoLogin, FormData>(
    entrar,
    undefined,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Controle de Produção e Estoque</CardTitle>
          <CardDescription>
            Entre com o e-mail e senha cadastrados pelo administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {estado?.erro && (
              <p className="text-sm text-red-600" role="alert">
                {estado.erro}
              </p>
            )}
            <Button type="submit" size="lg" disabled={pendente} className="mt-2">
              {pendente ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
