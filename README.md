# FinanLab Maker — Protótipo do Mês 2 (MVC estático)

## Como abrir
O navegador não deixa páginas abertas por duplo clique lerem arquivos JSON. Use um servidor local:
- **Windows:** duplo clique em `iniciar.bat` (precisa do Python) → http://localhost:8000
- **Linux/Mac:** `./iniciar.sh`
- **VS Code:** extensão *Live Server* → "Open with Live Server" no `index.html`.
Para publicar, basta enviar a pasta inteira para qualquer hospedagem estática (GitHub Pages, Netlify).

## Estrutura (MVC)
- `dados/` → **conteúdo em JSON** (edite aqui, sem mexer no código):
  `configuracao.json` (saldo inicial, renda, preço do game, inflação, rendimento, meses), `diagnostico.json`,
  `trilhas.json`, `cenarios.json`, `oficinas.json`, `medalhas.json`.
- `js/modelo/` → **Modelo:** `dados.js` (lê os JSON) e `jogador.js` (estado salvo no navegador + regras: diagnóstico, trilhas, simulação, medalhas).
- `js/visao/visao.js` → **Visão:** gera o HTML de cada tela.
- `js/controlador/controlador.js` → **Controlador:** cliques, navegação e atualização da tela.
- `js/principal.js` → ponto de entrada. `css/estilo.css` → estilos.

## Edições comuns
- Novo cenário do simulador: copie um bloco em `cenarios.json` (tipos usados nas medalhas: `poupar`, `consumo_consciente`, `impulso`, `neutro`).
- Nova medalha: adicione em `medalhas.json` (critérios: `contagemTipo`, `rendimentoAcumulado`, `trilhaConcluida`, `metaAlcancada`).
- Nova trilha ou módulo: `trilhas.json`. Trilha com `"disponivel": false` aparece bloqueada.
- Balanceamento: ajuste `configuracao.json`.
- O progresso é salvo no `localStorage`; use "Apagar meu progresso" na tela Início para zerar.

## Limites deste protótipo
Estático, sem login nem banco de dados; trilha de nível 3, repositório didático completo e coleta de dados do piloto ficam para os próximos meses.
