"use client";

import * as React from "react";
import { useActionState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { criarUsuario, type EstadoCriarUsuario } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

type Perfil = { id: string; codigo: string; nome_exibicao: string };
type Maquina = { id: string; nome: string };
type Usuario = {
  id: string;
  nome: string;
  ativo: boolean;
  perfis: { codigo: string; nome_exibicao: string } | { codigo: string; nome_exibicao: string }[] | null;
  maquinas: { nome: string } | { nome: string }[] | null;
};

function primeiro<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const CHAVE_CONSULTA = ["usuarios"];

export function UsuariosClient({
  usuariosIniciais,
  perfis,
  maquinas,
}: {
  usuariosIniciais: Usuario[];
  perfis: Perfil[];
  maquinas: Maquina[];
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const queryKey = CHAVE_CONSULTA;

  const { data: usuarios = usuariosIniciais } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*, perfis(codigo, nome_exibicao), maquinas(nome)")
        .order("nome");
      if (error) throw error;
      return data as Usuario[];
    },
    initialData: usuariosIniciais,
  });

  const alternarAtivo = useMutation({
    mutationFn: async (usuario: Usuario) => {
      const { error } = await supabase
        .from("usuarios")
        .update({ ativo: !usuario.ativo })
        .eq("id", usuario.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erro ao atualizar."),
  });

  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [estado, formAction, pendente] = useActionState<EstadoCriarUsuario, FormData>(
    criarUsuario,
    undefined,
  );
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (!estado?.sucesso) return;
    // Reage ao resultado da server action (sistema externo), não a um
    // valor derivável durante a renderização — por isso o setState aqui
    // é intencional, mesmo com o lint de efeitos reclamando.
    toast.success("Usuário criado.");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDialogAberto(false);
    formRef.current?.reset();
    queryClient.invalidateQueries({ queryKey });
  }, [estado, queryClient, queryKey]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Usuários</h1>
          <p className="text-sm text-neutral-500">
            Só o administrador cria login. Um usuário pode ser uma pessoa (perfil
            líder/gestor/admin) ou um login fixo de máquina (perfil operador).
          </p>
        </div>
        <Button onClick={() => setDialogAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Máquina vinculada</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-neutral-400">
                    Nenhum usuário ainda.
                  </TableCell>
                </TableRow>
              )}
              {usuarios.map((usuario) => {
                const perfil = primeiro(usuario.perfis);
                const maquina = primeiro(usuario.maquinas);
                return (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.nome}</TableCell>
                    <TableCell>{perfil?.nome_exibicao ?? "—"}</TableCell>
                    <TableCell>{maquina?.nome ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={usuario.ativo ? "default" : "secondary"}>
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alternarAtivo.mutate(usuario)}
                      >
                        {usuario.ativo ? "Inativar" : "Reativar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>
          <form ref={formRef} action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail (login)</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="senha">Senha provisória</Label>
              <Input id="senha" name="senha" type="password" minLength={6} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="perfil_id">Perfil</Label>
              <Select name="perfil_id">
                <SelectTrigger id="perfil_id">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {perfis.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome_exibicao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maquina_vinculada_id">
                Máquina vinculada (só para login de operador de máquina)
              </Label>
              <Select name="maquina_vinculada_id">
                <SelectTrigger id="maquina_vinculada_id">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  {maquinas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {estado?.erro && (
              <p className="text-sm text-red-600" role="alert">
                {estado.erro}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pendente}>
                {pendente ? "Criando..." : "Criar usuário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
