import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Privacidade', alternates: { canonical: '/privacidade' } };
export default function Privacy() {
  return <main className="simple-page"><a href="/">Voltar ao portfólio</a><h1>Privacidade, com clareza.</h1>
    <p>Este portfólio usa métricas próprias para entender quais projetos despertam interesse. Você pode aceitar ou recusar essa medição e alterar sua escolha no botão “Privacidade” da página inicial.</p>
    <h2>Visitas e interações</h2><p>Com sua permissão, registramos visitas, botões e projetos clicados, tipo de dispositivo e domínio de origem. Um identificador aleatório permite estimar visitantes. Quando fornecida pela hospedagem, a localização é aproximada, limitada a país e cidade. Não solicitamos sua localização precisa nem guardamos seu endereço IP nas métricas. A opção “Não rastrear” do navegador é respeitada.</p>
    <h2>Currículo</h2><p>A entrega do arquivo do currículo é contabilizada para medir os downloads. Essa contagem não confirma se a pessoa salvou ou leu o documento. Downloads feitos no painel administrativo são excluídos.</p>
    <h2>Armazenamento e segurança</h2><p>Os eventos de análise são mantidos por até 90 dias. Cookies essenciais protegem o acesso administrativo; a preferência de privacidade fica armazenada no seu navegador. Para limitar tentativas abusivas, o servidor usa um identificador temporário derivado do IP, sem armazenar o endereço original.</p>
    <h2>Contato e serviços externos</h2><p>Links para WhatsApp, Instagram, LinkedIn e outros projetos levam a serviços com suas próprias políticas de privacidade. Para dúvidas sobre este portfólio, escreva para <a href="mailto:dev.arrthur@gmail.com">dev.arrthur@gmail.com</a>.</p>
  </main>;
}
