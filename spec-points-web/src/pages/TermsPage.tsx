import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </button>

        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 md:p-12">
          <div className="text-center mb-12 border-b border-border pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              TERMOS DE USO, POLÍTICA DE PRIVACIDADE<br/>
              E REGULAMENTO DE RESGATE DE PRÊMIOS
            </h1>
            <p className="text-xl text-muted-foreground mb-6">Campanha de Premiação para Arquitetos — 2026/2027</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left bg-secondary/30 p-6 rounded-xl text-sm">
              <div><strong>Documento:</strong> Termos de Uso e Regulamento de Prêmios</div>
              <div><strong>Versão:</strong> 1.0</div>
              <div><strong>Data de vigência:</strong> [DD/MM/AAAA]</div>
              <div><strong>Última atualização:</strong> Abril de 2026</div>
              <div><strong>Responsável:</strong> [Nome do Responsável Legal]</div>
              <div><strong>Contato:</strong> [e-mail@plataforma.com.br]</div>
              <div className="md:col-span-2"><strong>CNPJ:</strong> [XX.XXX.XXX/XXXX-XX]</div>
            </div>
          </div>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg text-foreground font-medium">
              ⚠️ LEIA COM ATENÇÃO ANTES DE USAR A PLATAFORMA<br/>
              Ao se cadastrar ou utilizar esta plataforma, o usuário declara ter lido, compreendido e concordado integralmente com estes Termos de Uso, com a Política de Privacidade e com o Regulamento de Resgate de Prêmios aqui estabelecidos. Caso não concorde com qualquer disposição, não utilize a plataforma.
            </div>

            <section id="secao-1">
              <h2 className="text-2xl font-bold text-foreground mb-4">1. IDENTIFICAÇÃO DAS PARTES</h2>
              <p><strong>1.1. PLATAFORMA / CONTROLADORA DOS DADOS:</strong></p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Razão Social: [Razão Social da Empresa]</li>
                <li>Nome Fantasia: [Nome da Plataforma]</li>
                <li>CNPJ: [XX.XXX.XXX/XXXX-XX]</li>
                <li>Endereço: [Endereço completo, Cidade – UF, CEP]</li>
                <li>E-mail para contato: [contato@plataforma.com.br]</li>
                <li>E-mail para LGPD/DPO: [privacidade@plataforma.com.br]</li>
                <li>Telefone: [XX XXXXX-XXXX]</li>
                <li>Responsável Legal: [Nome do Sócio / Diretor]</li>
              </ul>
              <p><strong>1.2. USUÁRIO:</strong> Pessoa física, arquiteto(a) ou profissional de arquitetura e design de interiores, devidamente cadastrado(a) nesta plataforma, que aceita estes termos e participa da campanha de pontuação e premiação.</p>
            </section>

            <section id="secao-2">
              <h2 className="text-2xl font-bold text-foreground mb-4">2. DEFINIÇÕES</h2>
              <p>2.1. Para os fins deste documento, aplicam-se as seguintes definições:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Plataforma:</strong> Sistema digital de propriedade da empresa identificada na Cláusula 1, por meio do qual arquitetos acumulam pontos e resgatam prêmios.</li>
                <li><strong>Usuário:</strong> Arquiteto(a) cadastrado(a) e participante ativo.</li>
                <li><strong>Pontos:</strong> Unidade de recompensa virtual, sem valor monetário.</li>
                <li><strong>Prêmio:</strong> Benefício obtido pelo Usuário mediante o resgate de pontos acumulados.</li>
                <li><strong>Catálogo de Prêmios:</strong> Listagem atualizada de prêmios disponíveis para resgate.</li>
                <li><strong>Resgate:</strong> Ato formal pelo qual o Usuário solicita a conversão de seus pontos.</li>
                <li><strong>Voucher:</strong> Documento que comprova o direito ao prêmio resgatado.</li>
                <li><strong>LGPD:</strong> Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018).</li>
                <li><strong>Alta Temporada:</strong> Períodos de férias escolares (janeiro, julho e dezembro), feriados nacionais e datas de grande demanda turística.</li>
                <li><strong>Baixa Temporada:</strong> Períodos fora das datas de Alta Temporada, nos quais o resgate de viagens é permitido.</li>
              </ul>
            </section>

            <section id="secao-3">
              <h2 className="text-2xl font-bold text-foreground mb-4">3. DO CADASTRO E ELEGIBILIDADE</h2>
              <p><strong>3.1. Requisitos para cadastro</strong><br/>
              Podem se cadastrar na plataforma pessoas físicas que atendam cumulativamente aos seguintes requisitos:</p>
              <ul className="list-disc pl-6 space-y-1 my-2">
                <li>Ser arquiteto(a) regularmente habilitado(a);</li>
                <li>Ter idade mínima de 18 (dezoito) anos;</li>
                <li>Possuir CPF/RUC válido e ativo;</li>
                <li>Informar endereço de e-mail válido e de uso pessoal;</li>
                <li>Aceitar integralmente os presentes Termos de Uso.</li>
              </ul>
              
              <p className="mt-4"><strong>3.3. Responsabilidade pelas informações</strong><br/>
              3.3.1. O Usuário é o único responsável pela veracidade, precisão e atualização das informações cadastrais fornecidas.<br/>
              3.3.2. A plataforma reserva-se o direito de suspender ou cancelar o cadastro de Usuário que fornecer dados falsos, incompletos ou desatualizados.<br/>
              3.3.3. Cada Usuário pode ter apenas um cadastro ativo.</p>
            </section>

            <section id="secao-4">
              <h2 className="text-2xl font-bold text-foreground mb-4">4. DO SISTEMA DE PONTUAÇÃO</h2>
              <p><strong>4.1. Geração de pontos</strong><br/>
              Os pontos são gerados conforme regras de negócios estabelecidas pela Plataforma (ex: indicação, registro de vendas aprovadas, etc.).</p>
              
              <p className="mt-4"><strong>4.2. Validade dos pontos</strong><br/>
              4.2.1. Os pontos não resgatados dentro do prazo de validade serão automaticamente cancelados.<br/>
              4.2.2. O Usuário será notificado com antecedência sobre o vencimento de pontos.</p>

              <p className="mt-4"><strong>4.3. Natureza dos pontos</strong><br/>
              4.3.1. Os pontos são de natureza estritamente virtual e não possuem valor monetário.<br/>
              4.3.2. Os pontos são pessoais e intransferíveis.<br/>
              4.3.3. A plataforma pode alterar as regras de pontuação mediante comunicação prévia.</p>

              <p className="mt-4"><strong>4.4. Cancelamento e estorno de pontos</strong><br/>
              4.4.1. Pontos gerados por erro operacional, fraude ou descumprimento destes Termos poderão ser cancelados.<br/>
              4.4.2. Em caso de devolução de produto ou cancelamento/reprovação de serviço que gerou pontos, os respectivos pontos serão estornados.</p>
            </section>

            <section id="resgate" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">5. CATÁLOGO E RESGATE DE PRÊMIOS</h2>
              <p><strong>5.1. Categorias de prêmios disponíveis</strong><br/>
              A plataforma disponibiliza viagens, pacotes turísticos (operacionalizados pela Orbistur) e outros prêmios descritos no catálogo vigente.</p>

              <p className="mt-4"><strong>5.2. Processo de resgate</strong><br/>
              5.2.1. O resgate deve ser realizado na plataforma, selecionando o prêmio e preenchendo os dados complementares.<br/>
              5.2.2. Após a confirmação, os pontos correspondentes serão debitados imediatamente. Caso o resgate não seja aprovado, os pontos serão estornados.<br/>
              5.2.3. O Voucher de confirmação será enviado ao e-mail cadastrado em até dias úteis estipulados.</p>

              <p className="mt-4"><strong>5.3. Disponibilidade e estoque</strong><br/>
              5.3.1. Os prêmios estão sujeitos à disponibilidade e vigência do catálogo.</p>
            </section>

            <section id="secao-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">6. REGRAS ESPECÍFICAS PARA RESGATE DE VIAGENS</h2>
              <div className="bg-secondary/30 p-4 rounded-lg mb-4 text-sm">
                ℹ️ <strong>Parceria Operacional:</strong> Os pacotes de viagem são operacionalizados pela agência Orbistur, parceira oficial da plataforma.
              </div>
              <p><strong>6.1. Solicitação e prazos</strong><br/>
              A solicitação da viagem deverá ser feita com antecedência mínima de 4 (quatro) meses da data pretendida para embarque. A definição do destino estará sujeita à disponibilidade.</p>

              <p className="mt-4"><strong>6.2. Períodos permitidos para viagens</strong><br/>
              As viagens somente poderão ser realizadas em períodos de baixa temporada do destino escolhido. Não serão permitidos embarques em férias escolares, feriados nacionais, e datas de grande demanda.</p>

              <p className="mt-4"><strong>6.3. O que está incluído nos pacotes de viagem</strong><br/>
              Passagens aéreas (quando aplicável), hospedagem (conforme regime), traslados regulares e seguro viagem conforme a categoria do destino.</p>

              <p className="mt-4"><strong>6.5. Documentação e responsabilidades do viajante</strong><br/>
              O Usuário é inteiramente responsável por providenciar passaporte, vistos, vacinas obrigatórias e demais exigências. A plataforma não se responsabiliza por impedimentos de embarque decorrentes de documentação inadequada.</p>
              
              <p className="mt-4"><strong>6.6. Acompanhantes</strong><br/>
              A premiação contempla 2 (duas) pessoas viajando juntas em apto duplo standard.</p>
              
              <p className="mt-4"><strong>6.7. Alterações, cancelamentos e no-show</strong><br/>
              Aplicam-se as regras tarifárias das companhias aéreas e fornecedores. Cancelamentos fora do prazo ou não comparecimento (no-show) implicarão perda total do prêmio sem restituição.</p>
            </section>

            <section id="secao-7">
              <h2 className="text-2xl font-bold text-foreground mb-4">7. POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)</h2>
              <p>O tratamento de dados pessoais nesta plataforma está fundamentado na Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD). A Plataforma atua como Controlador dos dados. Dados coletados incluem informações cadastrais, de uso, e transacionais, tratados para fins de execução de contrato, legítimo interesse, obrigação legal e consentimento.</p>
            </section>

            <section id="secao-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">8. CONDUTA DO USUÁRIO E VEDAÇÕES</h2>
              <p>É expressamente vedado ao Usuário fornecer informações falsas, utilizar mecanismos automatizados, tentar hackear a plataforma, vender pontos ou criar múltiplas contas. A constatação dessas práticas pode resultar em suspensão da conta e exclusão do programa.</p>
            </section>

            <section id="secao-9">
              <h2 className="text-2xl font-bold text-foreground mb-4">9. LIMITAÇÃO DE RESPONSABILIDADE</h2>
              <p>9.1. A plataforma atua como intermediadora do programa de fidelidade, não sendo responsável por:<br/>
              - Falhas operacionais de companhias aéreas, hotéis ou agências;<br/>
              - Danos decorrentes de caso fortuito ou força maior;<br/>
              - Uso indevido da conta pelo próprio Usuário;<br/>
              - Decisões tomadas com base em informações desatualizadas no catálogo.</p>
              <p>9.2. A responsabilidade máxima da plataforma perante o Usuário limita-se à restituição dos pontos envolvidos na transação.</p>
            </section>

            <section id="secao-10">
              <h2 className="text-2xl font-bold text-foreground mb-4">10. DISPOSIÇÕES GERAIS</h2>
              <p>Estes Termos constituem o acordo integral. Caso qualquer cláusula seja declarada inválida, as demais permanecem em plena vigência. Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial o Código Civil, o Código de Defesa do Consumidor e a LGPD.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
