import Link from "next/link";

// Bloco de texto estático da home. Fica no HTML inicial para que buscadores
// e revisores entendam o propósito do site sem precisar de login.
export function HomeInfoSection() {
  return (
    <section
      aria-labelledby="sobre-o-app"
      className="mx-auto mt-10 max-w-2xl space-y-4 px-6 text-sm text-muted-foreground"
    >
      <h2 id="sobre-o-app" className="text-lg font-bold text-foreground">
        O contador gratuito para competições de rodízio
      </h2>
      <p>
        O Rodízio Race transforma rodízios de pizza, sushi e hambúrguer em
        uma disputa leve entre amigos. Você cria uma sala, compartilha o
        código, e cada participante marca o que comeu pelo celular. O ranking
        é atualizado em tempo real para todos, com opção de jogar em equipes e
        de registrar fotos no modo foto.
      </p>
      <p>
        Quer ideias para a próxima saída? Leia nossos{" "}
        <Link href="/guia" className="font-semibold underline underline-offset-4">
          guias de competição de rodízio
        </Link>
        , veja{" "}
        <Link
          href="/como-funciona"
          className="font-semibold underline underline-offset-4"
        >
          como o app funciona
        </Link>{" "}
        ou tire dúvidas nas{" "}
        <Link href="/faq" className="font-semibold underline underline-offset-4">
          perguntas frequentes
        </Link>
        .
      </p>
    </section>
  );
}
