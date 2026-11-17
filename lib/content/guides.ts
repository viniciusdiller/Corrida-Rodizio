// lib/content/guides.ts
// Conteúdo editorial público (pt-BR). Renderizado no servidor para que
// buscadores e revisores consigam ler o texto sem precisar de login.

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  readingMinutes: number;
  published: string; // ISO
  updated: string; // ISO
  intro: string;
  sections: GuideSection[];
};

export const guides: Guide[] = [
  {
    slug: "como-organizar-competicao-de-rodizio",
    title: "Como organizar uma competição de rodízio entre amigos",
    description:
      "Passo a passo para montar uma disputa de rodízio divertida: escolha do local, combinados, contagem e como lidar com o empate.",
    readingMinutes: 5,
    published: "2026-11-17",
    updated: "2026-11-17",
    intro:
      "Rodízio com amigos já é programa bom por si só. Com uma disputa leve no meio, vira aquele tipo de noite que o grupo comenta por semanas. O segredo é combinar tudo antes de o primeiro prato chegar, para ninguém discutir regra com a boca cheia.",
    sections: [
      {
        heading: "Escolha o tipo de rodízio",
        paragraphs: [
          "Pizza, sushi, carne e hambúrguer funcionam de jeitos bem diferentes. Na pizza, o garçom circula com sabores variados e a unidade natural é a fatia. No sushi, a unidade costuma ser a peça, e uma peça de salmão não pesa o mesmo que um hot roll grande. No rodízio de carnes, não existe unidade clara, então a disputa funciona melhor por rodadas ou por espetos.",
          "Antes de marcar, decida qual unidade vale ponto. Quanto mais simples, menos confusão. Se o grupo está começando, pizza é a escolha mais fácil, porque a fatia já vem pronta.",
        ],
      },
      {
        heading: "Defina as regras antes de sentar",
        paragraphs: [
          "Regras ditas na hora geram briga. Combine tudo no grupo de mensagens antes do encontro e deixe registrado, assim ninguém alega que não sabia.",
        ],
        list: [
          "Qual é a unidade que conta ponto (fatia inteira, peça de sushi, hambúrguer).",
          "Se bebida entra na contagem ou se é uma categoria à parte.",
          "Se vale dividir uma fatia ao meio e contar meio ponto.",
          "Quanto tempo dura a disputa, por exemplo até a sobremesa ser servida.",
          "O que acontece com o resultado: quem perde paga a sobremesa, ou só ganha a fama.",
        ],
      },
      {
        heading: "Escolha quem confere a contagem",
        paragraphs: [
          "Em grupos pequenos, a confiança resolve. Em grupos maiores, ajuda ter uma pessoa que não está competindo, que pode ser quem tira as fotos ou cuida do placar. Se todos jogam, o combinado é simples: cada um marca o que comeu e os outros podem contestar na hora.",
          "O Rodízio Race foi pensado exatamente para isso. Cada participante marca o próprio consumo pelo celular e o ranking aparece para todos ao mesmo tempo, então a contagem fica visível e ninguém precisa confiar na memória do outro.",
        ],
      },
      {
        heading: "Pense no ritmo e no conforto",
        paragraphs: [
          "Competir não significa se forçar. Quem come rápido demais no começo costuma desistir na metade, e o rodízio inteiro dura bem mais que os primeiros dez minutos. Beba água, converse, aproveite o sabor. A graça da disputa está na brincadeira, não no limite do corpo de ninguém.",
          "Se alguém não quiser entrar na competição, deixe participar como espectador. Dá para acompanhar o placar, torcer e ainda aproveitar a refeição no próprio ritmo.",
        ],
      },
      {
        heading: "Decida como desempatar",
        paragraphs: [
          "Empates acontecem, principalmente quando todo mundo para ao mesmo tempo. Alguns critérios simples: vence quem terminou o último ponto primeiro, quem provou mais sabores diferentes, ou o desempate vai para uma rodada extra de sobremesa. Escolha um antes de começar.",
        ],
      },
    ],
  },
  {
    slug: "regras-para-competicao-de-pizza-entre-amigos",
    title: "Regras para uma competição de pizza entre amigos",
    description:
      "Sugestão de regras claras para disputar quem come mais fatias no rodízio de pizza, com variações para grupos e equipes.",
    readingMinutes: 4,
    published: "2026-11-17",
    updated: "2026-11-17",
    intro:
      "A pizza é a estrela das competições de rodízio porque tem unidade óbvia: a fatia. Mesmo assim, algumas dúvidas aparecem sempre. Fatia de borda conta? E a de doce? Este guia reúne um conjunto de regras simples que você pode adaptar ao seu grupo.",
    sections: [
      {
        heading: "O que conta como uma fatia",
        paragraphs: [
          "O padrão mais justo é contar uma fatia servida e inteira como um ponto, independentemente do sabor. Se o grupo quiser dar mais peso às pizzas doces, que costumam ser menores, combine um valor diferente antes de começar.",
          "Fatias muito pequenas, como as pontas cortadas em pedaços extras por alguns restaurantes, podem ser tratadas como meio ponto. O importante é que todos usem o mesmo critério durante a noite toda.",
        ],
      },
      {
        heading: "Regras básicas sugeridas",
        paragraphs: [
          "Estas são as regras que funcionam bem em grupos de três a dez pessoas:",
        ],
        list: [
          "Só conta a fatia depois de comida, não depois de colocada no prato.",
          "Não vale trocar de prato com outra pessoa para dividir a contagem.",
          "Cada pessoa marca os próprios pontos e qualquer um pode contestar.",
          "Fatia deixada pela metade conta meio ponto, no máximo.",
          "A disputa termina quando o restaurante servir a sobremesa ou ao combinado do grupo.",
        ],
      },
      {
        heading: "Jogando em equipe",
        paragraphs: [
          "Em grupos grandes, dividir em equipes deixa a disputa mais social. Cada time soma os pontos dos integrantes, e quem come menos ainda contribui. Isso também ajuda quem tem apetite menor a participar sem pressão.",
          "Equipes de duas a quatro pessoas costumam equilibrar bem. Se os times ficarem desiguais, divida o total pela quantidade de integrantes para comparar pela média.",
        ],
      },
      {
        heading: "Combine uma regra de bom senso",
        paragraphs: [
          "Defina um limite de bom senso: ninguém precisa continuar se estiver desconfortável. Quem para, sai da disputa sem constrangimento, e o placar final registra o que cada um fez. A competição existe para divertir, e quem se sente pressionado estraga a noite para o grupo.",
        ],
      },
    ],
  },
  {
    slug: "dicas-para-rodizio-de-sushi",
    title: "Dicas para aproveitar melhor um rodízio de sushi",
    description:
      "Como escolher o que pedir, manter o ritmo e contar peças de forma justa em uma competição de rodízio japonês.",
    readingMinutes: 4,
    published: "2026-11-17",
    updated: "2026-11-17",
    intro:
      "O rodízio japonês tem uma particularidade: as peças são pequenas e variadas, então é fácil perder a conta. Entre sashimi, niguiri, uramaki e hot roll, o que vale como um ponto? Aqui vão sugestões para aproveitar a refeição e manter a disputa organizada.",
    sections: [
      {
        heading: "Defina a unidade antes de pedir",
        paragraphs: [
          "Sugestão prática: conte cada peça individual como um ponto. Um combinado com oito peças vale oito. Isso evita discussões sobre o tamanho, já que o corte padrão do restaurante normaliza a unidade.",
          "Se o grupo preferir, dá para contar por pedido, mas isso favorece quem pede combinados pequenos para marcar mais pontos com menos comida, então só use essa regra se todos concordarem.",
        ],
      },
      {
        heading: "Comece pelo leve e deixe o frito para depois",
        paragraphs: [
          "Sashimi e niguiri são mais leves e deixam espaço para o resto. Pratos fritos e com cream cheese enchem rápido. Quem quer aproveitar a variedade do cardápio deve deixar esses itens para a segunda metade.",
          "Aproveite também para experimentar sabores que você nunca pediu. O rodízio é uma boa chance de descobrir o que gosta sem pagar a mais por cada tentativa.",
        ],
      },
      {
        heading: "Cuidado com o ritmo e a hidratação",
        paragraphs: [
          "Pratos com arroz saciam mais do que parecem, e o chá ou a água ajudam a manter a digestão tranquila. Intercale as peças com gengibre e vá com calma. Quem começa devagar costuma chegar mais longe e aproveitar mais.",
        ],
      },
      {
        heading: "Use o placar a seu favor",
        paragraphs: [
          "Marcar cada peça logo depois de comer evita a famosa dúvida de fim de noite sobre quantas foram. Em um app de contagem como o Rodízio Race, o toque no celular leva menos de um segundo e o ranking atualiza para todos ao mesmo tempo.",
        ],
      },
    ],
  },
  {
    slug: "como-contar-fatias-sem-confusao",
    title: "Como contar fatias e peças sem confusão",
    description:
      "Métodos práticos para registrar o consumo em um rodízio: papel, memória, fotos e aplicativo, com vantagens e limitações de cada um.",
    readingMinutes: 4,
    published: "2026-11-17",
    updated: "2026-11-17",
    intro:
      "Contar parece fácil, até a décima fatia. Entre conversa, bebida e música alta, a memória falha rápido. Existem formas diferentes de registrar o consumo, e cada uma serve melhor para um tipo de grupo.",
    sections: [
      {
        heading: "Papel e caneta",
        paragraphs: [
          "É o método clássico: um guardanapo com o nome de cada um e risquinhos. Funciona em mesas pequenas e não exige bateria. O problema é que o papel suja, rasga e só uma pessoa o enxerga bem. Em grupos de mais de quatro, a conferência vira bagunça.",
        ],
      },
      {
        heading: "Contar de memória",
        paragraphs: [
          "Funciona só em disputas curtas. Com mais de uma dúzia de itens por pessoa, as contagens divergem e a discussão no final estraga o clima. Se o grupo optar por esse método, aceite de antemão que o resultado é aproximado.",
        ],
      },
      {
        heading: "Fotos dos pratos",
        paragraphs: [
          "Fotografar cada prato vazio cria um registro visual e ainda vira recordação. Dá trabalho para conferir depois, e nem todo mundo quer ter a refeição documentada, então combine antes se todos aceitam fotos.",
        ],
      },
      {
        heading: "Aplicativo de contagem",
        paragraphs: [
          "Um app como o Rodízio Race resolve os pontos fracos dos outros métodos: cada jogador marca o próprio consumo, o placar é compartilhado em tempo real e a sala pode ter equipes, avatares e modo foto opcional. Basta criar uma sala, passar o código para os amigos e começar.",
          "Independentemente do método, vale seguir uma regra de ouro: marque na hora, não depois. A contagem em tempo real é a mais confiável.",
        ],
      },
    ],
  },
  {
    slug: "rodizio-em-equipe-formatos-e-ideias",
    title: "Rodízio em equipe: formatos e ideias para jogar em grupo",
    description:
      "Ideias de formatos para disputas por times em rodízios: pontuação coletiva, duplas, desafios e prêmios simbólicos.",
    readingMinutes: 4,
    published: "2026-11-17",
    updated: "2026-11-17",
    intro:
      "Competir em equipe muda o clima da mesa. Quem normalmente não entraria numa disputa individual ganha motivo para participar, e o time vira motivo de provocação amigável. Estes formatos ajudam a deixar a disputa mais leve e inclusiva.",
    sections: [
      {
        heading: "Times por cor",
        paragraphs: [
          "Dividir o grupo em times de cores (azul, vermelho, verde, amarelo) é rápido e dá identidade visual ao placar. Sorteie os integrantes para equilibrar e evite times formados só pelos amigos mais competitivos.",
        ],
      },
      {
        heading: "Pontuação coletiva",
        paragraphs: [
          "A forma mais simples é somar os pontos de todos os integrantes. Se os times têm tamanhos diferentes, use a média por pessoa. Assim o time menor não sai prejudicado e o resultado é justo.",
        ],
      },
      {
        heading: "Desafios paralelos",
        paragraphs: [
          "Para dar variedade, crie desafios além da contagem:",
        ],
        list: [
          "Time que provar mais sabores diferentes de pizza.",
          "Dupla que terminar uma rodada de sushi primeiro.",
          "Melhor foto do prato de cada equipe.",
          "Quem escolher o sabor mais inusitado do rodízio.",
        ],
      },
      {
        heading: "Prêmios simbólicos",
        paragraphs: [
          "O prêmio não precisa ser dinheiro nem aposta. O time perdedor pode pagar a sobremesa, escolher o próximo restaurante ou fazer um brinde ao vencedor. Prêmios simbólicos mantêm o espírito de brincadeira e evitam pressão financeira.",
        ],
      },
      {
        heading: "Inclusão de quem não quer competir",
        paragraphs: [
          "Reserve um papel para quem prefere só assistir: responsável pelo placar, juiz de contestações ou narrador. Assim ninguém fica de fora e a mesa continua unida.",
        ],
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
