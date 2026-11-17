import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell, SITE_URL } from "@/components/site/public-shell";
import { getGuide, guides } from "@/lib/content/guides";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guia/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: `${SITE_URL}/guia/${guide.slug}`,
      publishedTime: guide.published,
      modifiedTime: guide.updated,
    },
  };
}

export default async function GuiaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const others = guides.filter((item) => item.slug !== guide.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.published,
    dateModified: guide.updated,
    inLanguage: "pt-BR",
    mainEntityOfPage: `${SITE_URL}/guia/${guide.slug}`,
    publisher: { "@type": "Organization", name: "Rodízio Race" },
  };

  return (
    <PublicShell>
      <article className="space-y-8">
        <nav aria-label="Trilha" className="text-xs text-muted-foreground">
          <Link href="/guia" className="underline underline-offset-4">
            Guias
          </Link>{" "}
          / {guide.title}
        </nav>

        <header className="space-y-3">
          <h1 className="text-3xl font-black text-foreground">{guide.title}</h1>
          <p className="text-xs text-muted-foreground">
            {guide.readingMinutes} min de leitura · atualizado em{" "}
            {new Date(guide.updated).toLocaleDateString("pt-BR", {
              timeZone: "UTC",
            })}
          </p>
          <p className="text-muted-foreground">{guide.intro}</p>
        </header>

        {guide.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm text-muted-foreground">
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <aside className="rounded-2xl border border-muted/60 bg-card/80 p-5">
          <h2 className="font-bold text-foreground">Pronto para jogar?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie uma sala gratuita no Rodízio Race, passe o código para os
            amigos e acompanhe o ranking em tempo real.{" "}
            <Link
              href="/"
              className="font-semibold underline underline-offset-4"
            >
              Abrir o app
            </Link>
            .
          </p>
        </aside>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Leia também</h2>
          <ul className="space-y-2 text-sm">
            {others.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/guia/${item.slug}`}
                  className="underline underline-offset-4 text-muted-foreground hover:text-foreground"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </article>
    </PublicShell>
  );
}
