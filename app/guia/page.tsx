import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";
import { guides } from "@/lib/content/guides";

export const metadata: Metadata = {
  title: "Guias de competição de rodízio",
  description:
    "Dicas, regras e ideias para organizar competições de rodízio de pizza, sushi e hambúrguer entre amigos.",
  alternates: { canonical: "/guia" },
};

export default function GuiaIndexPage() {
  return (
    <PublicShell>
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Blog e guias
          </p>
          <h1 className="text-3xl font-black text-foreground">
            Guias para competições de rodízio
          </h1>
          <p className="text-muted-foreground">
            Textos práticos sobre como organizar a disputa, definir regras
            justas, contar o consumo sem confusão e jogar em equipe. Tudo
            pensado para manter a brincadeira leve e inclusiva.
          </p>
        </header>

        <ul className="space-y-4">
          {guides.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/guia/${guide.slug}`}
                className="block rounded-2xl border border-muted/60 bg-card/80 p-5 shadow-sm transition hover:border-foreground/30"
              >
                <h2 className="text-lg font-bold text-foreground">
                  {guide.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {guide.description}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {guide.readingMinutes} min de leitura · atualizado em{" "}
                  {new Date(guide.updated).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PublicShell>
  );
}
