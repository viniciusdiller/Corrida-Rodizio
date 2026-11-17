import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, PublicShell } from "@/components/site/public-shell";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com a equipe do Rodízio Race: dúvidas, sugestões, relatos de problemas e solicitações sobre privacidade.",
  alternates: { canonical: "/contato" },
};

export default function ContatoPage() {
  return (
    <PublicShell>
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Fale com a gente
          </p>
          <h1 className="text-3xl font-black text-foreground">Contato</h1>
          <p className="text-muted-foreground">
            O Rodízio Race é um projeto independente. Respondemos por e-mail
            assim que possível.
          </p>
        </header>

        <section className="rounded-2xl border border-muted/60 bg-card/80 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">E-mail</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold underline underline-offset-4"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            Sobre o que você pode escrever
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Dúvidas sobre como usar o app.</li>
            <li>Sugestões de novos recursos, avatares ou tipos de comida.</li>
            <li>Relato de erros, informando o aparelho e o navegador.</li>
            <li>
              Pedidos sobre dados pessoais, conforme a{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Política de Privacidade
              </Link>
              .
            </li>
            <li>Parcerias e propostas de patrocínio.</li>
          </ul>
        </section>

        <p className="text-sm text-muted-foreground">
          Antes de escrever, vale conferir as{" "}
          <Link
            href="/faq"
            className="font-semibold underline underline-offset-4"
          >
            perguntas frequentes
          </Link>
          .
        </p>
      </div>
    </PublicShell>
  );
}
