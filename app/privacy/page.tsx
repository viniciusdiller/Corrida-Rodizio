const sections = [
  {
    title: "Informações que coletamos",
    content: [
      "Podemos coletar informações pessoais de forma automática ou fornecidas voluntariamente pelo usuário, incluindo:",
    ],
    items: [
      "Endereço IP",
      "Tipo de navegador e dispositivo",
      "Páginas visitadas e tempo de navegação",
      "Cookies e tecnologias similares",
    ],
    footer:
      "Não solicitamos informações sensíveis como dados bancários, documentos oficiais ou informações de saúde.",
  },
  {
    title: "Uso das informações",
    content: ["As informações coletadas são utilizadas para:"],
    items: [
      "Melhorar a experiência do usuário",
      "Entender como o site é utilizado",
      "Monitorar desempenho e estabilidade",
      "Exibir anúncios relevantes",
    ],
  },
  {
    title: "Cookies e tecnologias de rastreamento",
    content: [
      "Utilizamos cookies para armazenar preferências do usuário e otimizar a navegação.",
      "Cookies podem ser utilizados por parceiros terceiros, incluindo o Google, para exibir anúncios personalizados com base nas visitas anteriores do usuário a este e a outros sites.",
      "Você pode desativar os cookies diretamente nas configurações do seu navegador.",
    ],
  },
  {
    title: "Google AdSense",
    content: [
      "Este site utiliza o Google AdSense, um serviço de publicidade fornecido pela Google.",
      "O Google pode usar cookies, incluindo o cookie DART, para exibir anúncios com base nos interesses do usuário e em suas visitas anteriores.",
      "Os usuários podem desativar a publicidade personalizada acessando:",
    ],
    link: "https://adssettings.google.com",
  },
  {
    title: "Compartilhamento de informações",
    content: [
      "Não vendemos, trocamos ou transferimos informações pessoais para terceiros, exceto quando exigido por lei ou para o funcionamento técnico do site (ex.: serviços de análise ou publicidade).",
    ],
  },
  {
    title: "Links para sites externos",
    content: [
      "O site pode conter links para sites externos. Não nos responsabilizamos pelas políticas de privacidade desses sites.",
    ],
  },
  {
    title: "Consentimento",
    content: [
      "Ao utilizar nosso site, você concorda com esta Política de Privacidade.",
    ],
  },
  {
    title: "Alterações nesta política",
    content: [
      "Esta política pode ser atualizada periodicamente. Recomendamos que você a revise regularmente.",
    ],
  },
  {
    title: "Contato",
    content: [
      "Em caso de dúvidas sobre esta Política de Privacidade, entre em contato pelo e-mail:",
    ],
    footer: "contato@mechama.eu",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-orange-100/50 via-background to-background dark:from-purple-950/50 dark:via-black dark:to-black px-6 pb-12 pt-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            📄 Política de Privacidade
          </p>
          <h1 className="text-3xl font-black text-foreground">Rodízio Race</h1>
          <p className="text-sm text-muted-foreground">
            Última atualização: 27 de janeiro de 2026
          </p>
          <p className="text-sm text-muted-foreground">
            O site Rodízio Race, acessível em https://rodiziorace.mechama.eu,
            respeita a sua privacidade e está comprometido em proteger os dados
            pessoais dos seus usuários. Esta Política de Privacidade descreve
            como coletamos, usamos e protegemos suas informações.
          </p>
        </header>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className="rounded-2xl border border-muted/60 bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur"
            >
              <h2 className="text-lg font-bold text-foreground">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                {section.content?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items && (
                  <ul className="list-disc space-y-1 pl-5">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.link && (
                  <a
                    className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    href={section.link}
                  >
                    {section.link}
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
