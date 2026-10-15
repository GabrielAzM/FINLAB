// MODELO — leitura dos arquivos JSON da pasta /dados
const NOMES_ARQUIVOS = ['configuracao', 'diagnostico', 'trilhas', 'cenarios', 'oficinas', 'medalhas'];

export async function carregarDados() {
  const dados = {};
  await Promise.all(NOMES_ARQUIVOS.map(async (nome) => {
    const resposta = await fetch(`dados/${nome}.json`);
    if (!resposta.ok) throw new Error(`Não foi possível carregar dados/${nome}.json`);
    dados[nome] = await resposta.json();
  }));
  return dados;
}
