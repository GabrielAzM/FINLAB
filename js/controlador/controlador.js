// CONTROLADOR — liga os cliques do usuário ao modelo e atualiza a visão
import {
  carregarJogador, salvarJogador, reiniciarJogador, registrarDiagnostico, concluirModulo,
  iniciarSimulacao, escolherOpcao, avaliarMedalhas
} from '../modelo/jogador.js';
import * as visao from '../visao/visao.js';

export function iniciarControlador(dados) {
  let jogador = carregarJogador();
  let telaAtual = 'inicio';
  let mensagem = '';
  const areaConteudo = document.getElementById('conteudo-principal');
  const areaPainel = document.getElementById('painel-superior');

  function atualizarTela() {
    areaPainel.innerHTML = visao.painelSuperior(jogador, dados);
    const aviso = mensagem ? `<div class="cartao aviso">${mensagem}</div>` : '';
    areaConteudo.innerHTML = aviso + visao.telas[telaAtual](jogador, dados);
    document.querySelectorAll('#menu-navegacao button').forEach((botao) =>
      botao.classList.toggle('ativo', botao.dataset.tela === telaAtual));
    mensagem = '';
  }

  function navegar(tela) {
    telaAtual = tela;
    atualizarTela();
    window.scrollTo(0, 0);
  }

  function avisarMedalhas(novas) {
    if (novas.length) mensagem = `🎖️ Nova medalha: ${novas.map((m) => `${m.icone} ${m.nome}`).join(', ')}!`;
  }

  const acoes = {
    enviarDiagnostico() {
      const respostas = dados.diagnostico.perguntas.map((p) => {
        const marcada = document.querySelector(`input[name="${p.id}"]:checked`);
        return marcada ? Number(marcada.value) : null;
      });
      if (respostas.includes(null)) { mensagem = 'Responda todas as perguntas para ver o resultado.'; return; }
      registrarDiagnostico(jogador, dados.diagnostico, respostas);
    },
    refazerDiagnostico() { jogador.diagnostico = null; },
    concluirModulo(alvo) {
      concluirModulo(jogador, alvo.dataset.id);
      avisarMedalhas(avaliarMedalhas(jogador, dados));
    },
    iniciarSimulacao() { iniciarSimulacao(jogador, dados); },
    reiniciarSimulacao() { iniciarSimulacao(jogador, dados); },
    escolherOpcao(alvo) { avisarMedalhas(escolherOpcao(jogador, dados, Number(alvo.dataset.indice))); },
    reiniciarTudo() {
      if (!confirm('Apagar todo o progresso salvo neste navegador?')) return;
      jogador = reiniciarJogador();
    }
  };

  document.addEventListener('click', (evento) => {
    const alvo = evento.target.closest('[data-acao], [data-tela]');
    if (!alvo) return;
    if (alvo.dataset.tela) { navegar(alvo.dataset.tela); return; }
    acoes[alvo.dataset.acao](alvo);
    salvarJogador(jogador);
    atualizarTela();
  });

  atualizarTela();
}
