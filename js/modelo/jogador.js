// MODELO — estado do jogador (salvo no navegador) e regras do jogo
const CHAVE_ARMAZENAMENTO = 'finanlab-maker-jogador';
const limitarPontuacao = (valor) => Math.max(0, Math.min(100, valor));

function criarEstadoInicial() {
  return { diagnostico: null, modulosConcluidos: [], simulador: null, medalhas: [] };
}

export function carregarJogador() {
  try {
    return { ...criarEstadoInicial(), ...JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO)) };
  } catch { return criarEstadoInicial(); }
}

export function salvarJogador(jogador) {
  try { localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(jogador)); } catch { /* sem armazenamento */ }
}

export function reiniciarJogador() {
  try { localStorage.removeItem(CHAVE_ARMAZENAMENTO); } catch { /* sem armazenamento */ }
  return criarEstadoInicial();
}

// ---------- Diagnóstico ----------
export function registrarDiagnostico(jogador, diagnostico, respostas) {
  const pontos = respostas.reduce((total, indice, i) => total + diagnostico.perguntas[i].opcoes[indice].pontos, 0);
  const maximo = diagnostico.perguntas.reduce((total, p) => total + Math.max(...p.opcoes.map((o) => o.pontos)), 0);
  const faixa = [...diagnostico.faixas].reverse().find((f) => pontos >= f.minimo);
  jogador.diagnostico = { pontos, maximo, nivel: faixa.nivel, trilhaRecomendada: faixa.trilhaRecomendada };
}

// ---------- Trilhas ----------
export function trilhaConcluida(jogador, trilha) {
  return trilha.modulos.length > 0 && trilha.modulos.every((m) => jogador.modulosConcluidos.includes(m.id));
}

export function trilhaLiberada(jogador, trilha, trilhas) {
  if (trilha.disponivel === false) return false;
  if (!trilha.requer) return true;
  return trilhaConcluida(jogador, trilhas.find((t) => t.id === trilha.requer));
}

export function concluirModulo(jogador, idModulo) {
  if (!jogador.modulosConcluidos.includes(idModulo)) jogador.modulosConcluidos.push(idModulo);
}

// ---------- Simulador ----------
export function cenarioDoMes(cenarios, mes) {
  return cenarios[(mes - 1) % cenarios.length];
}

export function iniciarSimulacao(jogador, dados) {
  const cfg = dados.configuracao.simulador;
  jogador.simulador = {
    mes: 1, totalMeses: cfg.totalMeses, saldo: cfg.saldoInicial, preco: cfg.precoJogo,
    pontuacao: dados.configuracao.pontuacaoInicial, rendimentoAcumulado: 0,
    contagemTipos: {}, historicoSaldo: [cfg.saldoInicial], historicoPreco: [cfg.precoJogo],
    ultimoFeedback: null, finalizado: false, comprou: false
  };
}

export function escolherOpcao(jogador, dados, indice) {
  const sim = jogador.simulador;
  const cfg = dados.configuracao.simulador;
  const cenario = cenarioDoMes(dados.cenarios, sim.mes);
  const opcao = cenario.opcoes[indice];
  if (!opcao || sim.finalizado || sim.saldo + opcao.variacao < 0) return [];

  sim.saldo += opcao.variacao;
  sim.pontuacao = limitarPontuacao(sim.pontuacao + opcao.pontos);
  sim.contagemTipos[opcao.tipo] = (sim.contagemTipos[opcao.tipo] || 0) + 1;
  sim.ultimoFeedback = { mes: sim.mes, cenario: cenario.titulo, texto: opcao.feedback, pontos: opcao.pontos };

  // virada do mês: rendimento da poupança e inflação sobre o preço do game
  const rendimento = sim.saldo * cfg.rendimentoPoupancaMensal;
  sim.saldo += rendimento;
  sim.rendimentoAcumulado += rendimento;
  sim.preco *= 1 + cfg.inflacaoMensal;

  if (sim.mes < sim.totalMeses) {
    sim.saldo += cfg.rendaMensal;
    sim.mes += 1;
  } else {
    sim.finalizado = true;
    sim.comprou = sim.saldo >= sim.preco;
    if (sim.comprou) sim.pontuacao = limitarPontuacao(sim.pontuacao + 10);
  }
  sim.historicoSaldo.push(sim.saldo);
  sim.historicoPreco.push(sim.preco);
  return avaliarMedalhas(jogador, dados);
}

// ---------- Medalhas ----------
function criterioAtingido(jogador, criterio, trilhas) {
  const sim = jogador.simulador;
  switch (criterio.tipo) {
    case 'contagemTipo': return !!sim && (sim.contagemTipos[criterio.tipoEscolha] || 0) >= criterio.minimo;
    case 'rendimentoAcumulado': return !!sim && sim.rendimentoAcumulado >= criterio.minimo;
    case 'metaAlcancada': return !!sim && sim.comprou;
    case 'trilhaConcluida': return trilhaConcluida(jogador, trilhas.find((t) => t.id === criterio.trilhaId));
    default: return false;
  }
}

export function avaliarMedalhas(jogador, dados) {
  const novas = dados.medalhas.filter((m) =>
    !jogador.medalhas.includes(m.id) && criterioAtingido(jogador, m.criterio, dados.trilhas));
  novas.forEach((m) => jogador.medalhas.push(m.id));
  return novas;
}
