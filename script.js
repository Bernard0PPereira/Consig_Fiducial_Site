/* ==========================================================================
   Fiducial, comportamento compartilhado.
   Saiu de dentro do index.html em 4 de agosto de 2026. Vale para todas as
   paginas. As constantes de configuracao ficam logo no inicio.
   ========================================================================== */
/* ==========================================================
   CONFIGURAÇÃO. ALTERE APENAS ESTA LINHA.
   Número do WhatsApp de atendimento, formato internacional,
   sem sinais e sem espaços: 55 + DDD + número.
   Exemplo para (11) 99999 9999  =  5511999999999
   ========================================================== */
const WHATSAPP_NUMBER = "5531975238397";

/* Mensagem pronta na conversa. Com false, o botão abre a conversa em branco e
   o link fica sendo só wa.me + número, sem nada depois.
   Custo de desligar: o consultor deixa de receber o código de origem no fim da
   mensagem, então perde de onde a pessoa veio. A medição dentro do site,
   no Google Analytics, continua funcionando igual. */
const MENSAGEM_PRONTA = false;

/* Medida de campanha. Vazio significa que nenhuma ferramenta está instalada e
   o site funciona igual. Basta preencher para a medição começar. */
const GA4_ID = "";

/* ====================== MEDIÇÃO DE CONTATO ======================
   Este site não tem formulário: todo lead vira conversa no WhatsApp. Então a
   única forma de saber o que funciona é registrar os dois lados.

   1. Dentro do site, um evento por clique, dizendo qual botão foi usado.
   2. Dentro da conversa, um código de origem no fim da mensagem, para o
      consultor saber de onde a pessoa veio sem precisar perguntar.

   Para ligar Google Ads ou pixel da Meta depois, basta acrescentar a chamada
   deles dentro de registrarContato. Não é preciso mexer em botão nenhum.
   ================================================================ */

/* Lê a origem da visita e guarda pela sessão, senão ela se perde no primeiro
   clique em link interno. */
var origemDaVisita = (function(){
  try{
    var busca = new URLSearchParams(location.search);
    var atual = busca.get('utm_source') || busca.get('origem');
    var campanha = busca.get('utm_campaign');
    if(atual){
      var texto = campanha ? atual + '/' + campanha : atual;
      sessionStorage.setItem('fiducial_origem', texto);
      return texto;
    }
    var guardado = sessionStorage.getItem('fiducial_origem');
    if(guardado) return guardado;
    if(document.referrer && document.referrer.indexOf(location.host) === -1){
      return 'site:' + document.referrer.replace(/^https?:\/\//, '').split('/')[0];
    }
  }catch(e){}
  return 'direto';
})();

function registrarContato(botao){
  if(window.gtag){
    gtag('event', 'contato_whatsapp', { botao: botao, origem_visita: origemDaVisita });
  }
  /* Google Ads e pixel da Meta entram aqui quando existirem. */
}

/* Monta os links de WhatsApp em todos os elementos marcados */
document.querySelectorAll('[data-wa]').forEach(function(el){
  var msg = el.getAttribute('data-msg') || 'Olá! Vim pelo site da Fiducial.';
  var botao = el.getAttribute('data-origem') || 'sem-identificacao';

  /* O código entra numa linha separada, para não atrapalhar a leitura da
     mensagem que a pessoa está mandando. */
  var texto = msg + '\n\n[ ' + botao + ' | ' + origemDaVisita + ' ]';

  var link = 'https://wa.me/' + WHATSAPP_NUMBER;
  if(MENSAGEM_PRONTA){ link += '?text=' + encodeURIComponent(texto); }

  el.setAttribute('href', link);
  el.setAttribute('target', '_blank');
  el.setAttribute('rel', 'noopener');
  el.addEventListener('click', function(){ registrarContato(botao); });
});

/* Google Analytics, só carrega se a medida estiver preenchida */
if(GA4_ID){
  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
  document.head.appendChild(tag);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA4_ID, { anonymize_ip: true });
}

/* Menu de três linhas do celular */
(function(){
  var cabecalho = document.querySelector('header');
  var botao = document.querySelector('.nav-abrir');
  if(!cabecalho || !botao) return;

  function fechar(){
    cabecalho.classList.remove('menu-aberto');
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-label', 'Abrir menu de seções');
  }

  botao.addEventListener('click', function(){
    var aberto = cabecalho.classList.toggle('menu-aberto');
    botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    botao.setAttribute('aria-label', aberto ? 'Fechar menu de seções' : 'Abrir menu de seções');
  });

  /* clicou num item, o menu sai da frente */
  document.querySelectorAll('#nav-links a').forEach(function(link){
    link.addEventListener('click', fechar);
  });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && cabecalho.classList.contains('menu-aberto')){
      fechar();
      botao.focus();
    }
  });

  /* voltou para a largura de desktop com o menu aberto, fecha para não travar nada */
  window.addEventListener('resize', function(){
    if(window.innerWidth > 940) fechar();
  });
})();

/* Logos dos bancos: se o arquivo de imagem não existir,
   mostra o nome do banco em texto no lugar */
function prepararLogos(escopo){
  escopo.querySelectorAll('.bank img').forEach(function(img){
    img.addEventListener('error', function(){
      var nome = img.getAttribute('data-nome') || img.getAttribute('alt') || '';
      var span = document.createElement('span');
      span.className = 'wordmark';
      span.textContent = nome;
      img.replaceWith(span);
    });
    if(img.complete && img.naturalWidth === 0){ img.dispatchEvent(new Event('error')); }
  });
}
prepararLogos(document);

/* Imagem do topo: se os arquivos hero.webp e hero.png não existirem,
   a coluna da direita some e o texto ocupa a largura toda */
(function(){
  var fig = document.getElementById('hero-figura');
  if(!fig) return;
  var img = fig.querySelector('img');
  function semImagem(){
    fig.remove();
    document.querySelector('.hero-grid').style.gridTemplateColumns = '1fr';
  }
  img.addEventListener('error', semImagem);
  if(img.complete && img.naturalWidth === 0) semImagem();
})();

/* Duplica a faixa de bancos para a rolagem ficar contínua */
(function(){
  var track = document.getElementById('bank-track');
  if(!track) return;
  var copia = track.cloneNode(true);
  while(copia.firstElementChild){
    var item = copia.firstElementChild;
    item.setAttribute('aria-hidden','true');
    track.appendChild(item);
  }
  prepararLogos(track);

  /* O laço só fica invisível se a animação deslizar exatamente a largura de uma
     volta da lista. Em vez de calcular, mede: a distância do primeiro card do
     bloco original até o primeiro card do bloco copiado é, por definição, o
     passo certo. Usa offsetLeft porque ele ignora a animação em andamento. */
  var passoAtual = null;

  function ajustarPasso(){
    var cards = track.children;
    var metade = cards.length / 2;
    if(cards.length < 2 || metade !== Math.floor(metade)) return;

    var passo = cards[metade].offsetLeft - cards[0].offsetLeft;
    if(!passo || passo < 1) return;

    /* Nada mudou de verdade, então não encosta na animação. Reiniciar aqui
       faria o carrossel voltar ao começo sem motivo. */
    if(passo === passoAtual) return;
    passoAtual = passo;

    var largura = 0;
    var vao = parseFloat(getComputedStyle(track).columnGap) || 0;
    for(var i = 0; i < cards.length; i++){
      largura += cards[i].getBoundingClientRect().width;
    }
    track.style.width = Math.ceil(largura + vao * (cards.length - 1)) + 'px';
    track.style.setProperty('--passo', passo + 'px');

    /* recomeça a animação, senão ela seguiria até o fim com o passo antigo */
    track.style.animation = 'none';
    void track.offsetWidth;
    track.style.animation = '';
  }

  if(document.readyState === 'complete'){
    ajustarPasso();
  }else{
    window.addEventListener('load', ajustarPasso);
  }

  /* No celular, rolar a página mostra e esconde a barra do navegador, e isso
     dispara resize o tempo todo. Só a largura interessa aqui, então mudança de
     altura é ignorada e o carrossel não é interrompido durante a rolagem. */
  var larguraAnterior = window.innerWidth;
  window.addEventListener('resize', function(){
    if(window.innerWidth === larguraAnterior) return;
    larguraAnterior = window.innerWidth;
    ajustarPasso();
  });
})();

/* Contadores animados */
function animarNumero(el){
  var alvo = parseFloat(el.getAttribute('data-count'));
  var dec = el.getAttribute('data-dec');
  var unidadeEl = el.querySelector('.u');
  var unidade = unidadeEl ? unidadeEl.outerHTML : '';
  var dur = 1400, inicio = performance.now();
  function passo(agora){
    var p = Math.min((agora - inicio) / dur, 1);
    var e = 1 - Math.pow(1 - p, 3);
    if(dec){
      el.innerHTML = (alvo + e * (parseInt(dec) / 10)).toFixed(1) + unidade;
    }else{
      el.innerHTML = Math.round(e * alvo) + unidade;
    }
    if(p < 1){ requestAnimationFrame(passo); }
    else{ el.innerHTML = (dec ? (alvo + parseInt(dec) / 10).toFixed(1) : alvo) + unidade; }
  }
  requestAnimationFrame(passo);
}

/* Revela os blocos ao rolar e dispara os contadores */
var io = new IntersectionObserver(function(entradas){
  entradas.forEach(function(en){
    if(!en.isIntersecting) return;
    en.target.classList.add('in');
    if(en.target.classList.contains('stats')){
      en.target.querySelectorAll('[data-count]').forEach(animarNumero);
    }
    io.unobserve(en.target);
  });
}, {threshold:.15});
document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

/* A barra de números só existe na home. Nas páginas de modalidade ela não
   existe, e observar null lança erro, o que derrubaria em silêncio tudo que
   vem depois neste arquivo, a começar pelas dúvidas frequentes.
   Este arquivo é compartilhado por todas as páginas desde 4 de agosto de 2026,
   então qualquer bloco novo aqui precisa aguentar o elemento não existir. */
var barraNumeros = document.querySelector('.stats');
if(barraNumeros) io.observe(barraNumeros);

/* Dúvidas frequentes */
document.querySelectorAll('.acc button').forEach(function(btn){
  btn.addEventListener('click', function(){
    var acc = btn.parentElement;
    var ans = acc.querySelector('.ans');
    var aberto = acc.classList.contains('open');
    document.querySelectorAll('.acc').forEach(function(a){
      a.classList.remove('open');
      a.querySelector('.ans').style.maxHeight = null;
    });
    if(!aberto){
      acc.classList.add('open');
      ans.style.maxHeight = ans.scrollHeight + 'px';
    }
  });
});