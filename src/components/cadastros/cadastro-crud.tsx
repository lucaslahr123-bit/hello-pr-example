"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type OpcaoSelect = { value: string; label: string };

export type CampoConfig =
  | { key: string; label: string; tipo: "text"; obrigatorio?: boolean }
  | {
      key: string;
      label: string;
      tipo: "number";
      obrigatorio?: boolean;
      step?: string;
    }
  | { key: string; label: string; tipo: "boolean" }
  | { key: string; label: string; tipo: "time"; obrigatorio?: boolean }
  | {
      key: string;
      label: string;
      tipo: "select";
      opcoes: OpcaoSelect[];
      obrigatorio?: boolean;
    };

export type ColunaConfig<T> = {
  chave: keyof T & string;
  titulo: string;
  formatar?: (registro: T) => React.ReactNode;
};

type Registro = { id: string; ativo?: boolean } & Record<string, unknown>;

function construirSchema(campos: CampoConfig[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const c of campos) {
    if (c.tipo === "boolean") {
      shape[c.key] = z.boolean().default(false);
      continue;
    }
    if (c.tipo === "number") {
      const s = z.coerce.number({ message: "Informe um número válido" });
      shape[c.key] = c.obrigatorio ? s : s.nullable().optional();
      continue;
    }
    // text | time | select
    const s: z.ZodTypeAny = z.string();
    shape[c.key] = c.obrigatorio
      ? (s as z.ZodString).min(1, "Obrigatório")
      : s.nullable().optional();
  }
  return z.object(shape);
}

export function CadastroCrud<T extends Registro>({
  tabela,
  titulo,
  descricao,
  campos,
  colunas,
  empresaId,
  registrosIniciais,
  ordenarPor = "nome",
  selecao = "*",
}: {
  tabela: string;
  titulo: string;
  descricao?: string;
  campos: CampoConfig[];
  colunas: ColunaConfig<T>[];
  empresaId: string;
  registrosIniciais: T[];
  ordenarPor?: string;
  /** string de `select()` do Supabase — passe os mesmos joins usados na busca inicial */
  selecao?: string;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const queryKey = React.useMemo(() => [tabela], [tabela]);

  const { data: registros = registrosIniciais } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tabela)
        .select(selecao)
        .order(ordenarPor);
      if (error) throw error;
      return data as unknown as T[];
    },
    initialData: registrosIniciais,
  });

  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [editando, setEditando] = React.useState<T | null>(null);

  const schema = React.useMemo(() => construirSchema(campos), [campos]);
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
  });

  function valoresPadrao() {
    const padrao: Record<string, unknown> = { ativo: true };
    for (const c of campos) {
      if (c.tipo === "boolean") padrao[c.key] = false;
    }
    return padrao;
  }

  function abrirNovo() {
    setEditando(null);
    form.reset(valoresPadrao());
    setDialogAberto(true);
  }

  function abrirEdicao(registro: T) {
    setEditando(registro);
    form.reset(registro as Record<string, unknown>);
    setDialogAberto(true);
  }

  const salvar = useMutation({
    mutationFn: async (valores: Record<string, unknown>) => {
      const payload = { ...valores, empresa_id: empresaId };
      if (editando) {
        const { error } = await supabase
          .from(tabela)
          .update(payload)
          .eq("id", editando.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tabela).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Salvo com sucesso.");
      setDialogAberto(false);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (erro: unknown) => {
      toast.error(erro instanceof Error ? erro.message : "Erro ao salvar.");
    },
  });

  const alternarAtivo = useMutation({
    mutationFn: async (registro: T) => {
      const { error } = await supabase
        .from(tabela)
        .update({ ativo: !registro.ativo })
        .eq("id", registro.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (erro: unknown) => {
      toast.error(erro instanceof Error ? erro.message : "Erro ao atualizar.");
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{titulo}</h1>
          {descricao && <p className="text-sm text-neutral-500">{descricao}</p>}
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {colunas.map((c) => (
                  <TableHead key={c.chave}>{c.titulo}</TableHead>
                ))}
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.length === 0 && (
                <TableRow>
                  <TableCell colSpan={colunas.length + 2} className="py-6 text-center text-neutral-400">
                    Nenhum registro ainda.
                  </TableCell>
                </TableRow>
              )}
              {registros.map((registro) => (
                <TableRow key={registro.id}>
                  {colunas.map((c) => (
                    <TableCell key={c.chave}>
                      {c.formatar ? c.formatar(registro) : String(registro[c.chave] ?? "—")}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Badge variant={registro.ativo ? "default" : "secondary"}>
                      {registro.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => abrirEdicao(registro)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alternarAtivo.mutate(registro)}
                      >
                        {registro.ativo ? "Inativar" : "Reativar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar" : "Novo"} — {titulo}</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((valores) => salvar.mutate(valores))}
          >
            {campos.map((campo) => (
              <div key={campo.key} className="flex flex-col gap-1.5">
                {campo.tipo !== "boolean" && (
                  <Label htmlFor={campo.key}>{campo.label}</Label>
                )}

                {(campo.tipo === "text" || campo.tipo === "time") && (
                  <Input
                    id={campo.key}
                    type={campo.tipo === "time" ? "time" : "text"}
                    {...form.register(campo.key)}
                  />
                )}

                {campo.tipo === "number" && (
                  <Input id={campo.key} type="number" step="any" {...form.register(campo.key)} />
                )}

                {campo.tipo === "select" && (
                  <Controller
                    control={form.control}
                    name={campo.key}
                    render={({ field }) => (
                      <Select value={(field.value as string) ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger id={campo.key}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {campo.opcoes.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}

                {campo.tipo === "boolean" && (
                  <div className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2">
                    <Label htmlFor={campo.key} className="font-normal">
                      {campo.label}
                    </Label>
                    <Controller
                      control={form.control}
                      name={campo.key}
                      render={({ field }) => (
                        <Switch
                          id={campo.key}
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                )}

                {form.formState.errors[campo.key] && (
                  <p className="text-xs text-red-600">
                    {String(form.formState.errors[campo.key]?.message)}
                  </p>
                )}
              </div>
            ))}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
