// PONTO DE ENTRADA — carrega os dados e inicia o controlador
import { carregarDados } from './modelo/dados.js';
import { iniciarControlador } from './controlador/controlador.js';

const areaConteudo = document.getElementById('conteudo-principal');

try {
  const dados = await carregarDados();
  iniciarControlador(dados);
} catch (erro) {
  console.error(erro);
  areaConteudo.innerHTML = `<div class="cartao aviso"><h2>Não foi possível carregar a plataforma</h2>
    <p>Os arquivos JSON precisam ser lidos por um servidor local. Abra a pasta no VS Code e use a extensão <strong>Live Server</strong>,
    ou execute o arquivo <strong>iniciar.bat</strong> (Windows) / <strong>iniciar.sh</strong> (Linux/Mac) e acesse <strong>http://localhost:8000</strong>.</p></div>`;
}
