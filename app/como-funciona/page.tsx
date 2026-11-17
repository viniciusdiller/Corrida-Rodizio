import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/site/public-shell";

export const metadata: Metadata = {
  title: "Como funciona o Rodízio Race",
  description:
    "Entenda como criar uma sala, convidar amigos, marcar fatias e acompanhar o ranking em tempo real no Rodízio Race.",
  alternates: { canonical: "/como-funciona" },
};

const steps = [
  {
    title: "Crie uma sala",
    text: "Na tela inicial, escolha o tipo de comida (pizza, sushi, hambúrguer ou bebida), digite seu codinome e crie a competição. O app gera um código curto para a sala.",
  },
  {
    title: "Convide os amigos",
    text: "Compartilhe o código ou o QR Code da sala. Cada amigo entra pelo próprio celular, escolhe um nome e, se quiser, um avatar. Não é preciso instalar nada: o app funciona no navegador e também pode ser adicionado à tela inicial.",
  },
  {
    title: "Marque o que você comeu",
    text: "A cada fatia ou peça, toque no botão de pontuação. O placar atualiza para todos na hora, então a contagem fica transparente e ninguém depende da memória de ninguém.",
  },
  {
    title: "Acompanhe o ranking",
    text: "A tela da sala mostra a classificação ao vivo, a pista da corrida e, no modo equipes, a soma de cada time (azul, vermelho, verde e amarelo).",
  },
  {
    title: "Encerre e compartilhe",
    text: "Quando a disputa terminar, o criador encerra a sala. O Hall da Fama gera uma imagem do resultado para você compartilhar nos Stories ou no grupo de amigos.",
  },
];

const features = [
  {
    title: "Tempo real",
    text: "As marcações aparecem para todos os participantes sem precisar recarregar a página.",
  },
  {
    title: "Modo equipes",
    text: "Divida o grupo em quatro cores e some os pontos por time, para quem prefere jogar junto.",
  },
  {
    title: "Modo foto opcional",
    text: "Usuários logados podem exigir uma foto a cada ponto. As fotos ficam em uma linha do tempo privada da sala e expiram depois de dois dias.",
  },
  {
    title: "Conta e histórico",
    text: "Crie uma conta para guardar o histórico das suas competições, usar avatares exclusivos e resgatar códigos promocionais.",
  },
  {
    title: "Três idiomas",
    text: "A interface está disponível em português, inglês e espanhol, e também em francês.",
  },
  {
    title: "Instalável",
    text: "É um app web progressivo (PWA): dá para adicioná-lo à tela inicial do celular e usar como um aplicativo.",
  },
];

export default function ComoFuncionaPage() {
  return (
    <PublicShell>
      <article className="space-y-10">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Guia rápido
          </p>
          <h1 className="text-3xl font-black text-foreground">
            Como funciona o Rodízio Race
          </h1>
          <p className="text-muted-foreground">
            O Rodízio Race é um contador gratuito para transformar rodízios de
            pizza, sushi e hambúrguer em uma competição amigável. Em vez de
            riscar guardanapo ou confiar na memória, cada participante marca
            o próprio consumo pelo celular e o ranking aparece para a mesa
            inteira ao mesmo tempo.
          </p>
        </header>

        <section aria-labelledby="passos" className="space-y-4">
          <h2 id="passos" className="text-xl font-bold text-foreground">
            Passo a passo
          </h2>
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-muted/60 bg-card/80 p-5 shadow-sm"
              >
                <h3 className="font-bold text-foreground">
                  {index + 1}. {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="recursos" className="space-y-4">
          <h2 id="recursos" className="text-xl font-bold text-foreground">
            Principais recursos
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-muted/60 bg-card/80 p-5 shadow-sm"
              >
                <h3 className="font-bold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="jogar-bem" className="space-y-3">
          <h2 id="jogar-bem" className="text-xl font-bold text-foreground">
            Jogue com bom senso
          </h2>
          <p className="text-sm text-muted-foreground">
            O objetivo do app é diversão. Ninguém precisa comer além do que
            está confortável, e quem preferir pode entrar na sala como
            espectador e só acompanhar o placar. Combine as regras com o grupo
            antes de começar. Se quiser ideias, leia nossos{" "}
            <Link
              href="/guia"
              className="font-semibold underline underline-offset-4"
            >
              guias sobre competições de rodízio
            </Link>{" "}
            ou veja as{" "}
            <Link
              href="/faq"
              className="font-semibold underline underline-offset-4"
            >
              perguntas frequentes
            </Link>
            .
          </p>
        </section>
      </article>
    </PublicShell>
  );
}
