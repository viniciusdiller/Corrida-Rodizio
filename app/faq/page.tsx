import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description:
    "Respostas sobre o Rodízio Race: como criar salas, entrar com um código, jogar em equipes, usar o modo foto e criar conta.",
  alternates: { canonical: "/faq" },
};

const faqs = [
  {
    q: "O que é o Rodízio Race?",
    a: "É um aplicativo web gratuito que serve como contador para competições de rodízio. Cada participante marca o que comeu pelo celular e o ranking é atualizado em tempo real para todos da sala.",
  },
  {
    q: "Preciso instalar algum aplicativo?",
    a: "Não. O Rodízio Race funciona direto no navegador. Se quiser, é possível adicioná-lo à tela inicial do celular, como um app instalado (PWA).",
  },
  {
    q: "Preciso criar uma conta para jogar?",
    a: "Não é obrigatório para criar ou entrar em uma sala. A conta serve para guardar o histórico das suas competições, usar avatares exclusivos, resgatar códigos promocionais e utilizar o modo foto.",
  },
  {
    q: "Como meus amigos entram na minha sala?",
    a: "Compartilhe o código da sala ou o QR Code gerado pelo app. Cada amigo informa o código na tela inicial, escolhe um nome e já pode participar.",
  },
  {
    q: "Quais tipos de comida posso contar?",
    a: "Pizza, sushi, hambúrguer e bebidas. Você escolhe o tipo ao criar a competição.",
  },
  {
    q: "Como funciona o modo equipes?",
    a: "No modo equipes, os participantes escolhem entre quatro times (azul, vermelho, verde e amarelo). A pontuação de cada time é a soma dos pontos dos integrantes.",
  },
  {
    q: "O que é o modo foto?",
    a: "É um recurso opcional para usuários logados. Quem cria a sala pode pedir uma foto a cada ponto marcado. As fotos ficam em uma linha do tempo privada da sala e expiram depois de dois dias.",
  },
  {
    q: "Posso só acompanhar a disputa sem competir?",
    a: "Sim. É possível entrar como espectador, acompanhar o placar e torcer sem marcar pontos.",
  },
  {
    q: "O app incentiva comer em excesso?",
    a: "Não. A proposta é uma brincadeira entre amigos. Ninguém deve se forçar além do conforto, e recomendamos combinar regras de bom senso antes de começar. Se alguém não se sentir bem, o melhor é parar.",
  },
  {
    q: "Como recupero minha conta se esquecer a senha?",
    a: "Se você cadastrou um e-mail de recuperação, pode pedir um código de redefinição na tela de login. Por isso recomendamos cadastrar o e-mail nas configurações da conta.",
  },
  {
    q: "Como entro em contato com o suporte?",
    a: "Escreva para contato@mechama.eu ou use a página de contato.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <PublicShell>
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Ajuda
          </p>
          <h1 className="text-3xl font-black text-foreground">
            Perguntas frequentes
          </h1>
          <p className="text-muted-foreground">
            Não achou o que procurava? Veja o{" "}
            <Link
              href="/como-funciona"
              className="font-semibold underline underline-offset-4"
            >
              passo a passo
            </Link>{" "}
            ou fale com a gente pela página de{" "}
            <Link
              href="/contato"
              className="font-semibold underline underline-offset-4"
            >
              contato
            </Link>
            .
          </p>
        </header>

        <dl className="space-y-4">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-muted/60 bg-card/80 p-5 shadow-sm"
            >
              <dt className="font-bold text-foreground">{item.q}</dt>
              <dd className="mt-2 text-sm text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </div>
    </PublicShell>
  );
}
