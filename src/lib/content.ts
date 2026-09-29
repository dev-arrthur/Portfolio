export type ProjectCategory = "online" | "internal" | "development";

export type Project = {
  id: string;
  name: string;
  category: ProjectCategory;
  categoryLabel: string;
  status: string;
  description: string;
  detail: string;
  focus: string[];
  url?: string;
  visual: string;
  wordmark: string;
  subtitle: string;
};

export const contact = {
  email: "dev.arrthur@gmail.com",
  whatsapp: "https://wa.me/5532991145114?text=Ol%C3%A1%2C%20Arthur!%20Vi%20seu%20portf%C3%B3lio%20e%20gostaria%20de%20conversar%20sobre%20um%20projeto.",
  community: "https://wa.me/5532991145114?text=Ol%C3%A1%2C%20Arthur!%20Tenho%20interesse%20na%20comunidade%20dev.%20Quero%20saber%20mais%20sobre%20a%20iniciativa.",
  github: "https://github.com/dev-arrthur",
  instagram: "https://www.instagram.com/hey.arrthur/",
  linkedin: "https://www.linkedin.com/in/arthurm-ferreira/",
};

export const projects: Project[] = [
  {
    id: "thynkbarber",
    name: "thynkBarber",
    category: "online",
    categoryLabel: "Produto SaaS",
    status: "Em fase final · já em uso",
    description: "Da agenda à gestão: um produto que acompanha o ritmo de uma barbearia e conecta a operação à experiência do cliente.",
    detail: "Produto próprio para centralizar agendamentos, equipe, serviços, assinaturas, comissões e indicadores em um só lugar. Minha atuação conecta arquitetura, back-end, integrações e evolução do produto a partir das necessidades de quem usa a plataforma no dia a dia. Em fase final de desenvolvimento, o sistema já atende mais de 7 barbearias de Juiz de Fora e região.",
    focus: ["Agendamentos", "Gestão de equipes", "Integrações financeiras", "Relacionamento com clientes"],
    url: "https://thynkbarber.com",
    visual: "barber",
    wordmark: "thynkBarber",
    subtitle: "A próxima fase da sua barbearia.",
  },
  {
    id: "maximum-carreiras",
    name: "Página de Carreiras",
    category: "online",
    categoryLabel: "Experiência web",
    status: "Online",
    description: "Uma porta de entrada para novos talentos. A cultura e as oportunidades da Maximum em uma experiência direta e acolhedora.",
    detail: "Página de carreiras da Maximum Assessoria Contábil, construída para apresentar a empresa e facilitar o encontro entre oportunidades profissionais e novos talentos. A apresentação valoriza clareza, identidade da marca e um caminho simples para conhecer as oportunidades.",
    focus: ["Marca empregadora", "Apresentação institucional", "Oportunidades", "Experiência responsiva"],
    url: "https://maximumcontabil.com.br/maximum-carreiras/",
    visual: "careers",
    wordmark: "maximum",
    subtitle: "O próximo capítulo da sua carreira.",
  },
  {
    id: "beneficios",
    name: "App de Vantagens e Benefícios",
    category: "internal",
    categoryLabel: "Aplicação interna",
    status: "Projeto particular / interno",
    description: "Benefícios mais próximos de quem importa. Campanhas, parceiros e vantagens reunidos em uma experiência simples de usar.",
    detail: "Aplicativo particular para reunir campanhas, parceiros, vantagens, cupons e ações de relacionamento. O projeto organiza as regras de negócio e a gestão dos benefícios para tornar o acesso mais claro e a operação mais prática. Por se tratar de uma aplicação interna, não há demonstração pública.",
    focus: ["Benefícios e cupons", "Campanhas", "Parceiros", "Gestão centralizada"],
    visual: "benefits",
    wordmark: "mais perto.",
    subtitle: "Vantagens que fazem parte do dia.",
  },
  {
    id: "documentos",
    name: "Cobrança de Documentos",
    category: "internal",
    categoryLabel: "Automação de processos",
    status: "Projeto particular / interno",
    description: "Menos solicitações dispersas, mais controle. Uma rotina documental organizada para reduzir tarefas repetitivas e acompanhar pendências.",
    detail: "Solução interna voltada à solicitação e ao acompanhamento de documentos. A proposta conecta organização de fluxos, automação de comunicação e rastreabilidade das pendências para apoiar a rotina operacional. O acesso e os dados do projeto são restritos à operação interna.",
    focus: ["Fluxos documentais", "Pendências", "Comunicação", "Rastreabilidade"],
    visual: "documents",
    wordmark: "tudo em dia.",
    subtitle: "Processos organizados. Equipes livres.",
  },
  {
    id: "acompanhamento",
    name: "Sistema de Acompanhamento",
    category: "development",
    categoryLabel: "Gestão e produtividade",
    status: "Em desenvolvimento",
    description: "Uma visão clara do trabalho em movimento. Demandas, evolução e indicadores pensados para facilitar o acompanhamento da operação.",
    detail: "Projeto em desenvolvimento para reunir o acompanhamento de demandas e a leitura de evolução da operação. A proposta é transformar informações dispersas em uma visão organizada de prioridades, responsabilidades e andamento, apoiando decisões e a rotina das equipes.",
    focus: ["Demandas", "Prioridades", "Indicadores", "Visibilidade operacional"],
    visual: "tracking",
    wordmark: "em movimento.",
    subtitle: "Clareza para o próximo passo.",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Multichannel",
    category: "development",
    categoryLabel: "Atendimento e mensageria",
    status: "Em desenvolvimento",
    description: "Conversas conectadas, atendimento organizado. Uma central para aproximar equipes, clientes e os próximos passos de cada contato.",
    detail: "Plataforma em desenvolvimento para centralizar atendimentos por WhatsApp. O projeto prevê filas, distribuição de conversas, múltiplos usuários e histórico para organizar a comunicação de operações comerciais e de suporte. O foco está na continuidade do atendimento e em uma experiência clara para a equipe.",
    focus: ["Atendimento multicanal", "Filas e distribuição", "Histórico", "Colaboração"],
    visual: "whatsapp",
    wordmark: "vamos conversar.",
    subtitle: "Cada conversa, uma conexão.",
  },
  {
    id: "redemg",
    name: "RedeMG Farma",
    category: "online",
    categoryLabel: "Plataforma corporativa",
    status: "Online",
    description: "Tecnologia conectada à operação de uma rede. Participação na evolução de uma experiência digital para o segmento farmacêutico.",
    detail: "Projeto profissional desenvolvido durante a atuação na UsePress, com participação na evolução de sistemas e da presença digital da RedeMG Farma. O trabalho reúne necessidades de operação, organização de informações e integração entre serviços no contexto de uma rede de farmácias.",
    focus: ["Projeto na UsePress", "Presença digital", "Operação em rede", "Integrações"],
    url: "https://redemgfarma.com.br/",
    visual: "farma",
    wordmark: "RedeMG Farma",
    subtitle: "Conexões que cuidam.",
  },
  {
    id: "recrie",
    name: "Recrie",
    category: "online",
    categoryLabel: "Experiência digital",
    status: "Online",
    description: "Informação com direção. Evolução de páginas e fluxos para tornar a jornada digital mais clara, fluida e fácil de navegar.",
    detail: "Participação profissional, pela UsePress, no desenvolvimento e na evolução da experiência digital da Recrie. O foco está na organização de conteúdo, na hierarquia de informação e em fluxos que aproximam o visitante da proposta da marca, com atenção à usabilidade e ao desempenho.",
    focus: ["Projeto na UsePress", "Usabilidade", "Hierarquia de informação", "Navegação"],
    url: "https://recrieprofissionais.com.br/",
    visual: "recrie",
    wordmark: "recrie.",
    subtitle: "Possibilidades que se encontram.",
  },
  {
    id: "cobrancas",
    name: "Sistema de Cobranças",
    category: "internal",
    categoryLabel: "Operação financeira",
    status: "Uso particular / interno de cliente",
    description: "Mais contexto para cada cobrança. Organização de clientes, vencimentos e acompanhamento em uma rotina financeira centralizada.",
    detail: "Sistema de uso particular de cliente, voltado à organização e ao acompanhamento de cobranças. A proposta reúne clientes, vencimentos e o histórico da operação para dar clareza ao que precisa de atenção e facilitar a rotina de gestão. Dados, acesso e detalhes específicos do cliente permanecem privados.",
    focus: ["Clientes e vencimentos", "Acompanhamento", "Histórico", "Organização financeira"],
    visual: "billing",
    wordmark: "contas claras.",
    subtitle: "Controle para seguir em frente.",
  },
  {
    id: "thynkxp",
    name: "thynkXP",
    category: "online",
    categoryLabel: "Empresa de tecnologia",
    status: "Online",
    description: "O ponto de encontro entre visão de negócio e execução técnica. Sistemas, automações e produtos para quem quer crescer.",
    detail: "Empresa que fundei para desenvolver sistemas, automações e produtos SaaS orientados às necessidades reais de pequenos e médios negócios. Como fundador e CEO, atuo na estratégia, na arquitetura, no desenvolvimento e na evolução dos produtos, mantendo proximidade com as operações e os clientes.",
    focus: ["Fundador e CEO", "Estratégia de produto", "Sistemas e SaaS", "Automações"],
    url: "https://thynkxp.com.br/",
    visual: "thynkxp",
    wordmark: "thynkXP",
    subtitle: "Ideias que viram operação.",
  },
];

export const experience = [
  { period: "2024 — atual", company: "thynkXP", role: "Fundador e CEO", detail: "Estratégia, arquitetura e desenvolvimento de sistemas, automações e produtos SaaS para pequenos e médios negócios." },
  { period: "Abr 2026 — atual", company: "Maximum Assessoria Contábil", role: "Assistente de Programação Pleno", detail: "Back-end, automações, soluções internas e integrações com sistemas contábeis e fiscais." },
  { period: "Jan — abr 2026", company: "Maximum Assessoria Contábil", role: "Auxiliar de Programação", detail: "Mapeamento de necessidades, organização de demandas e desenvolvimento de automações operacionais." },
  { period: "Atuação por projetos", company: "UsePress", role: "Desenvolvedor Low-Code Júnior", detail: "Evolução de produtos digitais, integrações, manutenção, versionamento e deploy." },
  { period: "Jun 2024 — dez 2025", company: "UsePress", role: "Estagiário em Desenvolvimento de Sistemas", detail: "Desenvolvimento de sites e sistemas, suporte a clientes, backups e acompanhamento de servidores AWS." },
];

export const skills = ["Node.js", "JavaScript", "React", "Java", "MongoDB", "SQL", "AWS", "Docker", "Git & GitHub", "REST APIs", "RPA"];
export const integrations = ["ASAAS", "Mercado Pago", "Acessorias", "SIEG", "Questor", "GOB", "WhatsApp"];
