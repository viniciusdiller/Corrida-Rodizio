const terms = [
  {
    title: "Uso do site",
    content: [
      "O conteúdo disponibilizado no Rodízio Race é fornecido apenas para fins informativos e recreativos. O uso do site é de responsabilidade exclusiva do usuário.",
    ],
  },
  {
    title: "Propriedade intelectual",
    content: [
      "Todo o conteúdo presente neste site, incluindo textos, logos, gráficos e código, é de propriedade do Rodízio Race ou de seus respectivos autores, salvo indicação em contrário.",
      "É proibida a reprodução, distribuição ou modificação do conteúdo sem autorização prévia.",
    ],
  },
  {
    title: "Responsabilidades",
    content: [
      "Não garantimos que o site estará sempre disponível, livre de erros ou interrupções.",
      "Não nos responsabilizamos por eventuais danos diretos ou indiretos decorrentes do uso ou da impossibilidade de uso do site.",
    ],
  },
  {
    title: "Conteúdo de terceiros",
    content: [
      "O site pode exibir conteúdos ou anúncios de terceiros. Não nos responsabilizamos pela veracidade, qualidade ou legalidade desses conteúdos.",
    ],
  },
  {
    title: "Modificações do serviço",
    content: [
      "Reservamo-nos o direito de modificar, suspender ou encerrar o site ou qualquer funcionalidade a qualquer momento, sem aviso prévio.",
    ],
  },
  {
    title: "Limitação de responsabilidade",
    content: [
      "Em nenhuma circunstância o Rodízio Race será responsável por perdas ou danos decorrentes do uso do site.",
    ],
  },
  {
    title: "Lei aplicável",
    content: [
      "Estes Termos são regidos pelas leis aplicáveis da União Europeia, respeitando o Regulamento Geral de Proteção de Dados (GDPR), quando aplicável.",
    ],
  },
  {
    title: "Contato",
    content: [
      "Para dúvidas relacionadas a estes Termos de Uso, entre em contato:",
    ],
    footer: "contato@mechama.eu",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black px-6 pb-12 pt-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            📄 Termos de Uso
          </p>
          <h1 className="text-3xl font-black text-foreground">Rodízio Race</h1>
          <p className="text-sm text-muted-foreground">
            Última atualização: 27 de janeiro de 2026
          </p>
          <p className="text-sm text-muted-foreground">
            Ao acessar o site Rodízio Race, você concorda com os seguintes Termos
            de Uso. Caso não concorde com algum deles, recomendamos que não
            utilize o site.
          </p>
        </header>

        <div className="space-y-6">
          {terms.map((term, index) => (
            <section
              key={term.title}
              className="rounded-2xl border border-muted/60 bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur"
            >
              <h2 className="text-lg font-bold text-foreground">
                {index + 1}. {term.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                {term.content.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {term.footer && <p>{term.footer}</p>}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
