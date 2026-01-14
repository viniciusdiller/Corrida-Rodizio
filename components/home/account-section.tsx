import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, LogOut } from "lucide-react";
import { Race } from "@/types/database";

interface AccountSectionProps {
  loginCode: string | null;
  accountFlow: "login" | "create" | null;
  accountLoading: boolean;
  accountCodeInput: string;
  accountPassword: string;
  myGroups: Race[];
  isLoadingGroups: boolean;
  groupsError: string | null;
  onLogout: () => void;
  onLoadGroups: () => void;
  onLogin: () => void;
  onCreateLogin: () => void;
  setAccountFlow: (flow: "login" | "create" | null) => void;
  setAccountCodeInput: (val: string) => void;
  setAccountPassword: (val: string) => void;
  router: any;
}

export function AccountSection({
  loginCode,
  accountFlow,
  accountLoading,
  accountCodeInput,
  accountPassword,
  myGroups,
  isLoadingGroups,
  groupsError,
  onLogout,
  onLoadGroups,
  onLogin,
  onCreateLogin,
  setAccountFlow,
  setAccountCodeInput,
  setAccountPassword,
  router,
}: AccountSectionProps) {
  return (
    <div className="space-y-4">
      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground px-1">
        Conta
      </Label>
      {loginCode ? (
        <div className="space-y-3 rounded-2xl border border-muted/60 bg-background/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Seu código de login
              </p>
              <p className="text-2xl font-black tracking-[0.3em]">
                {loginCode}
              </p>
            </div>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl font-semibold"
            onClick={onLoadGroups}
            disabled={isLoadingGroups}
          >
            {isLoadingGroups ? "Carregando..." : "Meus grupos"}
          </Button>
          {groupsError && (
            <p className="text-xs text-red-500 font-semibold">{groupsError}</p>
          )}
          <div className="space-y-2">
            {myGroups.map((group) => (
              <div
                key={group.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-muted/60 bg-background/70 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold">{group.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Código {group.room_code}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-primary"
                  onClick={() => router.push(`/sala/${group.room_code}`)}
                >
                  Entrar
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : accountFlow ? (
        <div className="space-y-4 rounded-2xl border border-muted/60 bg-background/60 p-4">
          {accountFlow === "login" ? (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="accountCode"
                  className="text-xs uppercase font-bold text-muted-foreground"
                >
                  Seu Nome de Usuário
                </Label>
                <Input
                  id="accountCode"
                  placeholder="Ex: João Silva"
                  value={accountCodeInput}
                  onChange={(e) => setAccountCodeInput(e.target.value)}
                  className="h-12 text-lg font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="accountPassword"
                  className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
                >
                  Senha
                </Label>
                <Input
                  id="accountPassword"
                  type="password"
                  placeholder="Sua senha"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="h-12"
                />
              </div>
              <Button
                className="w-full h-12 rounded-xl font-bold"
                onClick={onLogin}
                disabled={accountLoading}
              >
                <LogIn className="mr-2 h-4 w-4" />{" "}
                {accountLoading ? "Entrando..." : "Entrar"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setAccountFlow("create")}
              >
                Não tem conta? Criar agora
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="newUsername"
                  className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
                >
                  Escolha seu Nome de Usuário
                </Label>
                <Input
                  id="newUsername"
                  placeholder="Ex: João Silva"
                  value={accountCodeInput}
                  onChange={(e) => setAccountCodeInput(e.target.value)}
                  className="h-12 text-lg font-bold "
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-xs uppercase tracking-widest font-bold text-muted-foreground"
                >
                  Escolha sua Senha
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Sua senha secreta"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="h-12 text-lg font-bold "
                />
              </div>
              <Button
                className="w-full h-12 rounded-xl font-bold"
                onClick={onCreateLogin}
                disabled={accountLoading}
              >
                {accountLoading
                  ? "Criando..."
                  : "Criar conta e Salvar Histórico"}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setAccountFlow("login")}
              >
                Já tenho conta
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setAccountFlow(null)}
          >
            Voltar
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl font-semibold"
          onClick={() => setAccountFlow("login")}
        >
          Entrar com uma conta
        </Button>
      )}
    </div>
  );
}
