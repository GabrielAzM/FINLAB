// VISÃO — monta o HTML de cada tela a partir dos dados e do estado do jogador
import { trilhaConcluida, trilhaLiberada, cenarioDoMes } from '../modelo/jogador.js';

const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function classificarSaude(pontos) {
  if (pontos >= 70) return { rotulo: 'Saudável', classe: 'saude-boa' };
  if (pontos >= 40) return { rotulo: 'Atenção', classe: 'saude-media' };
  return { rotulo: 'Crítica', classe: 'saude-ruim' };
}

function barraProgresso(valor, maximo, classe = '') {
  const porcentagem = Math.max(0, Math.min(100, (valor / maximo) * 100));
  return `<div class="barra"><div class="barra-preenchimento ${classe}" style="width:${porcentagem}%"></div></div>`;
}

function graficoSaldo(sim) {
  if (sim.historicoSaldo.length < 2) return '<p class="discreto">O gráfico aparece depois do primeiro mês jogado.</p>';
  const largura = 320, altura = 150, margem = 20;
  const maximo = Math.max(...sim.historicoSaldo, ...sim.historicoPreco) * 1.05;
  const x = (i) => margem + (i * (largura - 2 * margem)) / sim.totalMeses;
  const y = (v) => altura - margem - (v / maximo) * (altura - 2 * margem);
  const linha = (lista) => lista.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<svg class="grafico" viewBox="0 0 ${largura} ${altura}" role="img" aria-label="Saldo e preço do game por mês">
    <polyline class="linha-preco" points="${linha(sim.historicoPreco)}"/>
    <polyline class="linha-saldo" points="${linha(sim.historicoSaldo)}"/>
  </svg>
  <p class="legenda"><span class="ponto-saldo"></span> Seu saldo &nbsp; <span class="ponto-preco"></span> Preço do game (com inflação)</p>`;
}

export function painelSuperior(jogador, dados) {
  const sim = jogador.simulador;
  const pontos = sim ? sim.pontuacao : dados.configuracao.pontuacaoInicial;
  const saude = classificarSaude(pontos);
  return `
    <div class="painel-item"><span class="rotulo">Inteligência financeira</span>
      <strong>${pontos}/100 · ${saude.rotulo}</strong>${barraProgresso(pontos, 100, saude.classe)}</div>
    <div class="painel-item"><span class="rotulo">Nível</span><strong>${jogador.diagnostico ? jogador.diagnostico.nivel : 'Faça o diagnóstico'}</strong></div>
    <div class="painel-item"><span class="rotulo">Medalhas</span><strong>${jogador.medalhas.length}/${dados.medalhas.length}</strong></div>
    <div class="painel-item"><span class="rotulo">Saldo</span><strong>${sim ? formatarMoeda(sim.saldo) : '—'}</strong></div>`;
}

function telaInicio(jogador, dados) {
  const cfg = dados.configuracao.simulador;
  return `<div class="cartao">
    <h2>Bem-vindo ao ${dados.configuracao.nomePlataforma}!</h2>
    <p>Sua missão: <strong>${cfg.nomeMeta}</strong> de ${formatarMoeda(cfg.precoJogo)} em ${cfg.totalMeses} meses, tomando boas decisões financeiras.</p>
    <ol class="passos">
      <li><strong>Diagnóstico:</strong> descubra seu ponto de partida.</li>
      <li><strong>Trilhas:</strong> estude orçamento, metas, inflação e consumo.</li>
      <li><strong>Simulador:</strong> decida mês a mês e veja o impacto no saldo.</li>
      <li><strong>Oficinas maker:</strong> coloque a mão na massa.</li>
    </ol>
    <button class="botao" data-tela="${jogador.diagnostico ? 'trilhas' : 'diagnostico'}">${jogador.diagnostico ? 'Continuar nas trilhas' : 'Começar pelo diagnóstico'}</button>
    <button class="botao secundario" data-acao="reiniciarTudo">Apagar meu progresso</button>
  </div>`;
}

function telaDiagnostico(jogador, dados) {
  const d = dados.diagnostico;
  if (jogador.diagnostico) {
    const r = jogador.diagnostico;
    const trilha = dados.trilhas.find((t) => t.id === r.trilhaRecomendada);
    return `<div class="cartao"><h2>Seu resultado</h2>
      <p>Você fez <strong>${r.pontos} de ${r.maximo}</strong> pontos e está no nível <strong>${r.nivel}</strong>.</p>
      <p>Trilha recomendada: <strong>${trilha.titulo}</strong>.</p>
      <button class="botao" data-tela="trilhas">Ir para as trilhas</button>
      <button class="botao secundario" data-acao="refazerDiagnostico">Refazer diagnóstico</button></div>`;
  }
  const perguntas = d.perguntas.map((p, n) => `
    <fieldset class="pergunta"><legend>${n + 1}. ${p.enunciado}</legend>
      ${p.opcoes.map((o, i) => `<label class="opcao-radio"><input type="radio" name="${p.id}" value="${i}"> ${o.texto}</label>`).join('')}
    </fieldset>`).join('');
  return `<div class="cartao"><h2>${d.titulo}</h2><p>${d.descricao}</p>${perguntas}
    <button class="botao" data-acao="enviarDiagnostico">Ver meu resultado</button></div>`;
}

function telaTrilhas(jogador, dados) {
  return dados.trilhas.map((t) => {
    const liberada = trilhaLiberada(jogador, t, dados.trilhas);
    const recomendada = jogador.diagnostico && jogador.diagnostico.trilhaRecomendada === t.id;
    const feitos = t.modulos.filter((m) => jogador.modulosConcluidos.includes(m.id)).length;
    let corpo;
    if (!liberada) {
      const aviso = t.disponivel === false ? 'Em breve nas próximas etapas do projeto.' : 'Conclua a trilha anterior para liberar.';
      corpo = `<p class="discreto">🔒 ${aviso}</p>`;
    } else {
      corpo = barraProgresso(feitos, t.modulos.length) + t.modulos.map((m) => {
        const feito = jogador.modulosConcluidos.includes(m.id);
        return `<details class="modulo"><summary>${feito ? '✅' : '📖'} ${m.titulo}</summary>
          <p>${m.texto}</p><p class="reflexao">💭 ${m.reflexao}</p>
          ${feito ? '<p class="discreto">Módulo concluído.</p>' : `<button class="botao pequeno" data-acao="concluirModulo" data-id="${m.id}">Marcar como concluído</button>`}
        </details>`;
      }).join('');
    }
    return `<div class="cartao ${liberada ? '' : 'bloqueado'}">
      <h2>Nível ${t.nivel} · ${t.titulo} ${trilhaConcluida(jogador, t) ? '✅' : ''}</h2>
      ${recomendada ? '<span class="etiqueta">Recomendada para você</span>' : ''}
      <p>${t.descricao}</p>${corpo}</div>`;
  }).join('');
}

function telaSimulador(jogador, dados) {
  const cfg = dados.configuracao.simulador;
  const sim = jogador.simulador;
  if (!sim) {
    return `<div class="cartao"><h2>Simulador financeiro</h2>
      <p>Você começa com ${formatarMoeda(cfg.saldoInicial)} e recebe ${formatarMoeda(cfg.rendaMensal)} por mês.
      Em ${cfg.totalMeses} meses, precisa ter dinheiro suficiente para ${cfg.nomeMeta}. Atenção: o preço do game sobe com a inflação e o dinheiro guardado rende um pouco na poupança.</p>
      <button class="botao" data-acao="iniciarSimulacao">Iniciar simulação</button></div>`;
  }
  const feedback = sim.ultimoFeedback
    ? `<div class="feedback"><strong>Mês ${sim.ultimoFeedback.mes} · ${sim.ultimoFeedback.cenario}</strong> (${sim.ultimoFeedback.pontos >= 0 ? '+' : ''}${sim.ultimoFeedback.pontos} pontos)<br>${sim.ultimoFeedback.texto}</div>` : '';
  const indicadores = `<p>Saldo: <strong>${formatarMoeda(sim.saldo)}</strong> · Preço do game hoje: <strong>${formatarMoeda(sim.preco)}</strong></p>
    ${barraProgresso(sim.saldo, sim.preco, sim.saldo >= sim.preco ? 'saude-boa' : 'saude-media')}`;
  if (sim.finalizado) {
    return `<div class="cartao"><h2>${sim.comprou ? '🏆 Você conquistou o game!' : '😕 Ainda não deu desta vez'}</h2>
      ${indicadores}${feedback}
      <p>${sim.comprou ? 'Seu planejamento funcionou: o saldo cobriu o preço corrigido pela inflação.' : 'O saldo final não cobriu o preço corrigido pela inflação. Revise suas escolhas e tente de novo!'}</p>
      ${graficoSaldo(sim)}
      <button class="botao" data-acao="reiniciarSimulacao">Jogar novamente</button></div>`;
  }
  const cenario = cenarioDoMes(dados.cenarios, sim.mes);
  const opcoes = cenario.opcoes.map((o, i) => {
    const semSaldo = sim.saldo + o.variacao < 0;
    const sinal = o.variacao > 0 ? '+' : '';
    return `<button class="botao opcao" data-acao="escolherOpcao" data-indice="${i}" ${semSaldo ? 'disabled' : ''}>
      ${o.texto} <small>(${o.variacao === 0 ? 'sem custo' : sinal + formatarMoeda(o.variacao)}${semSaldo ? ' · saldo insuficiente' : ''})</small></button>`;
  }).join('');
  return `<div class="cartao"><h2>Mês ${sim.mes} de ${sim.totalMeses}</h2>${indicadores}${feedback}
    <h3>${cenario.titulo}</h3><p>${cenario.descricao}</p>${opcoes}${graficoSaldo(sim)}</div>`;
}

function telaOficinas(jogador, dados) {
  return dados.oficinas.map((o) => `<div class="cartao"><h2>🛠️ ${o.titulo}</h2>
    <p><span class="etiqueta">${o.nivelRecomendado}</span> <span class="etiqueta">${o.duracao}</span></p>
    <p><strong>Objetivo:</strong> ${o.objetivo}</p>
    <p><strong>Materiais:</strong> ${o.materiais.join('; ')}.</p>
    <ol>${o.passos.map((p) => `<li>${p}</li>`).join('')}</ol>
    <p><strong>Produto final:</strong> ${o.produtoFinal}</p></div>`).join('');
}

function telaPainel(jogador, dados) {
  const sim = jogador.simulador;
  const medalhas = dados.medalhas.map((m) => {
    const ganha = jogador.medalhas.includes(m.id);
    return `<div class="medalha ${ganha ? '' : 'apagada'}"><span class="icone">${m.icone}</span><strong>${m.nome}</strong><small>${m.descricao}</small></div>`;
  }).join('');
  const trilhas = dados.trilhas.filter((t) => t.modulos.length).map((t) => {
    const feitos = t.modulos.filter((m) => jogador.modulosConcluidos.includes(m.id)).length;
    return `<p>Nível ${t.nivel}: ${feitos}/${t.modulos.length} módulos${barraProgresso(feitos, t.modulos.length)}</p>`;
  }).join('');
  return `<div class="cartao"><h2>Painel de progresso</h2>
    <p>Diagnóstico: <strong>${jogador.diagnostico ? `${jogador.diagnostico.nivel} (${jogador.diagnostico.pontos}/${jogador.diagnostico.maximo})` : 'pendente'}</strong></p>
    ${trilhas}</div>
    <div class="cartao"><h2>Medalhas</h2><div class="grade-medalhas">${medalhas}</div></div>
    <div class="cartao"><h2>Evolução do saldo</h2>${sim ? graficoSaldo(sim) : '<p class="discreto">Inicie o simulador para ver o gráfico.</p>'}</div>`;
}

export const telas = {
  inicio: telaInicio, diagnostico: telaDiagnostico, trilhas: telaTrilhas,
  simulador: telaSimulador, oficinas: telaOficinas, painel: telaPainel
};
