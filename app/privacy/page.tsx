"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const privacy = t.privacy_page;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black px-6 pb-12 pt-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="rounded-xl font-semibold gap-2 shadow-sm bg-background/90 backdrop-blur"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.common.exit}
          </Button>
          <div className="flex w-full justify-end space-between gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {privacy.header_label}
          </p>
          <h1 className="text-3xl font-black text-foreground">
            {privacy.title}
          </h1>
          <p className="text-sm text-muted-foreground">{privacy.last_update}</p>
          <p className="text-sm text-muted-foreground">{privacy.intro}</p>
        </header>

        <div className="space-y-6">
          {privacy.sections.map((section, index) => (
            <section
              key={index}
              className="rounded-2xl border border-muted/60 bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur"
            >
              <h2 className="text-lg font-bold text-foreground">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                {section.content?.map((paragraph, pIndex) => (
                  <p key={pIndex}>{paragraph}</p>
                ))}
                {(section as any).items && (
                  <ul className="list-disc space-y-1 pl-5">
                    {(section as any).items.map(
                      (item: string, iIndex: number) => (
                        <li key={iIndex}>{item}</li>
                      ),
                    )}
                  </ul>
                )}
                {(section as any).link && (
                  <a
                    className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    href={(section as any).link}
                  >
                    {(section as any).link}
                  </a>
                )}
                {section.footer && <p>{section.footer}</p>}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
