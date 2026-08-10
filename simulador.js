/* ==========================================================================
   Fiducial, simulador de crédito consignado.
   Criado em 4 de agosto de 2026.

   COMO FUNCIONA
   O HTML da página só precisa ter um <div data-simulador></div>. Todo o resto
   é desenhado aqui, para as nove páginas do site compartilharem a mesma peça
   sem copiar markup.

   O QUE ELE NÃO FAZ, DE PROPÓSITO
   Não existe <form>, não pede nome, CPF, telefone nem e-mail, não envia nada
   para lugar nenhum e não guarda nada. É uma calculadora que roda no próprio
   aparelho da pessoa. Isso mantém a regra do cliente de que a página não tem
   formulário e o contato acontece pelo WhatsApp.

   Depende do script.js, que precisa vir antes, porque reaproveita a constante
   WHATSAPP_NUMBER e a função registrarContato.
   ========================================================================== */

/* ==========================================================================
   TAXAS REAIS, informadas pelo cliente em 4 de agosto de 2026.
   Substituíram os valores ilustrativos que existiam antes. Se um dia mudarem,
   este é o único lugar do site que precisa ser tocado.

   A taxa é ao mês, em porcentagem, e o último número da lista de prazos é o
   prazo máximo daquela modalidade.

   O teto NÃO veio do cliente. Ele é só o fim da barra que a pessoa arrasta,
   para a simulação ter um limite razoável na tela. Não é limite de crédito de
   ninguém e pode ser mexido à vontade.
   ========================================================================== */
const SIMULADOR = {
  perfis: [
    { id: 'inss',     nome: 'Aposentado ou pensionista do INSS', taxa: 1.85, prazos: [12,24,36,48,60,72,84,96,108],     teto: 50000 },
    { id: 'clt',      nome: 'Trabalhador com carteira assinada', taxa: 4.98, prazos: [12,24,36,48],                     teto: 20000 },
    { id: 'servidor', nome: 'Servidor público',                  taxa: 2.50, prazos: [12,24,36,48,60,72,84,96,108,120], teto: 80000 },
    { id: 'militar',  nome: 'Militar',                           taxa: 2.50, prazos: [12,24,36,48,60,72,84,96,108,120], teto: 80000 }
  ],
  valorMin: 500,
  valorPasso: 500,
  valorPadrao: 10000,
  parcelaMin: 50,
  parcelaMax: 3000,
  parcelaPasso: 50,
  parcelaPadrao: 400
};

(function(){
  var alvos = document.querySelectorAll('[data-simulador]');
  if(!alvos.length) return;

  /* Cada simulador da página ganha ids próprios. Sem isto, duas instâncias na
     mesma página teriam campos com o mesmo id, e clicar no rótulo de um levaria
     o foco para o campo do outro. A busca dos elementos é por data-campo, que
     não depende de id nenhum. */
  var contador = 0;

  /* ---------- conta ----------
     Tabela Price, que é a forma como consignado é cobrado: parcela fixa, juros
     sobre o saldo que ainda falta. */
  function parcelaDoValor(valor, taxaPercent, meses){
    var i = taxaPercent / 100;
    if(i <= 0) return valor / meses;
    return valor * i / (1 - Math.pow(1 + i, -meses));
  }
  function valorDaParcela(parcela, taxaPercent, meses){
    var i = taxaPercent / 100;
    if(i <= 0) return parcela * meses;
    return parcela * (1 - Math.pow(1 + i, -meses)) / i;
  }

  function real(v){
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function realCurto(v){
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  }

  function perfilPor(id){
    for(var k = 0; k < SIMULADOR.perfis.length; k++){
      if(SIMULADOR.perfis[k].id === id) return SIMULADOR.perfis[k];
    }
    return SIMULADOR.perfis[0];
  }

  function linkWhatsApp(){
    var numero = (typeof WHATSAPP_NUMBER !== 'undefined') ? WHATSAPP_NUMBER : '';
    return 'https://wa.me/' + numero;
  }

  function montar(alvo){
    /* O perfil inicial pode vir da página, com data-simulador="inss". Assim
       cada página de modalidade abre o simulador já no perfil dela. */
    var perfilInicial = alvo.getAttribute('data-simulador') || 'inss';
    var uid = 'sim' + (++contador);
    var estado = {
      modo: 'valor',
      perfil: perfilPor(perfilInicial).id,
      valor: SIMULADOR.valorPadrao,
      parcela: SIMULADOR.parcelaPadrao,
      meses: 0
    };

    var opcoesPerfil = SIMULADOR.perfis.map(function(p){
      return '<option value="' + p.id + '">' + p.nome + '</option>';
    }).join('');

    alvo.innerHTML =
      '<div class="sim-card">' +
        '<div class="sim-tabs" role="tablist">' +
          '<button class="sim-tab" type="button" role="tab" data-modo="valor">Quanto vai ficar a parcela</button>' +
          '<button class="sim-tab" type="button" role="tab" data-modo="parcela">Quanto eu consigo pegar</button>' +
        '</div>' +

        '<div class="sim-campos">' +
          '<div>' +
            '<label class="sim-rot" for="' + uid + '-perfil">Você recebe como</label>' +
            '<select class="sim-select" id="' + uid + '-perfil" data-campo="perfil">' + opcoesPerfil + '</select>' +
          '</div>' +

          '<div>' +
            '<label class="sim-rot" for="' + uid + '-faixa" data-rot-faixa></label>' +
            '<div class="sim-valor"><span data-moeda>R$</span><b data-numero></b></div>' +
            '<input class="sim-faixa" id="' + uid + '-faixa" data-campo="faixa" type="range" />' +
            '<div class="sim-limites"><span data-lim-min></span><span data-lim-max></span></div>' +
          '</div>' +

          '<div>' +
            '<label class="sim-rot" for="' + uid + '-prazo">Em quantos meses</label>' +
            '<select class="sim-select" id="' + uid + '-prazo" data-campo="prazo"></select>' +
          '</div>' +
        '</div>' +

        '<div class="sim-res">' +
          '<div class="sim-res-rot" data-res-rot></div>' +
          '<div class="sim-res-num" data-res-num></div>' +
          '<div class="sim-linhas" data-res-linhas></div>' +
        '</div>' +

        /* Aviso curto e visível, logo depois do número. O texto miúdo lá
           embaixo continua existindo, com o detalhe legal. Este aqui é o que a
           pessoa realmente lê antes de clicar. */
        '<div class="sim-alerta">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m1 15h-2v-2h2zm0-4h-2V7h2z"/></svg>' +
          '<p><b>Atenção:</b> esta é uma simulação. Fale com um consultor para confirmar o valor exato e as condições do seu caso.</p>' +
        '</div>' +

        '<div class="sim-cta">' +
          '<a class="btn btn-red btn-lg btn-block" data-sim-cta target="_blank" rel="noopener">Falar com um consultor</a>' +
        '</div>' +

        '<p class="sim-aviso">Simulação feita no seu próprio aparelho, com a taxa de referência de cada modalidade. ' +
        'Nada aqui é enviado ou guardado. A condição final depende da margem disponível, do banco escolhido e da ' +
        'análise de crédito, e pode ficar diferente do que aparece aqui. O Custo Efetivo Total é informado antes da assinatura.</p>' +
      '</div>';

    var elPerfil  = alvo.querySelector('[data-campo="perfil"]');
    var elFaixa   = alvo.querySelector('[data-campo="faixa"]');
    var elPrazo   = alvo.querySelector('[data-campo="prazo"]');
    var elNumero  = alvo.querySelector('[data-numero]');
    var elRotFx   = alvo.querySelector('[data-rot-faixa]');
    var elLimMin  = alvo.querySelector('[data-lim-min]');
    var elLimMax  = alvo.querySelector('[data-lim-max]');
    var elResRot  = alvo.querySelector('[data-res-rot]');
    var elResNum  = alvo.querySelector('[data-res-num]');
    var elLinhas  = alvo.querySelector('[data-res-linhas]');
    var elCta     = alvo.querySelector('[data-sim-cta]');
    var abas      = alvo.querySelectorAll('.sim-tab');

    elPerfil.value = estado.perfil;
    elCta.setAttribute('href', linkWhatsApp());
    elCta.addEventListener('click', function(){
      if(typeof registrarContato === 'function') registrarContato('simulador');
    });

    function encherPrazos(){
      var p = perfilPor(estado.perfil);
      elPrazo.innerHTML = p.prazos.map(function(m){
        return '<option value="' + m + '">' + m + ' meses</option>';
      }).join('');
      /* Mantém o prazo escolhido se ele existir no perfil novo, senão pega o
         maior, que é o que deixa a parcela mais baixa. */
      if(p.prazos.indexOf(estado.meses) === -1) estado.meses = p.prazos[p.prazos.length - 1];
      elPrazo.value = String(estado.meses);
    }

    function encherFaixa(){
      var p = perfilPor(estado.perfil);
      if(estado.modo === 'valor'){
        elRotFx.textContent = 'Quanto você quer pegar';
        elFaixa.min = SIMULADOR.valorMin;
        elFaixa.max = p.teto;
        elFaixa.step = SIMULADOR.valorPasso;
        if(estado.valor > p.teto) estado.valor = p.teto;
        elFaixa.value = estado.valor;
        elLimMin.textContent = realCurto(SIMULADOR.valorMin);
        elLimMax.textContent = realCurto(p.teto);
      }else{
        elRotFx.textContent = 'Quanto cabe no seu bolso por mês';
        elFaixa.min = SIMULADOR.parcelaMin;
        elFaixa.max = SIMULADOR.parcelaMax;
        elFaixa.step = SIMULADOR.parcelaPasso;
        elFaixa.value = estado.parcela;
        elLimMin.textContent = realCurto(SIMULADOR.parcelaMin);
        elLimMax.textContent = realCurto(SIMULADOR.parcelaMax);
      }
    }

    function calcular(){
      var p = perfilPor(estado.perfil);
      var linhas = '';

      if(estado.modo === 'valor'){
        elNumero.textContent = estado.valor.toLocaleString('pt-BR');
        var parcela = parcelaDoValor(estado.valor, p.taxa, estado.meses);
        var total = parcela * estado.meses;
        elResRot.textContent = 'Sua parcela ficaria em';
        elResNum.textContent = real(parcela);
        linhas =
          linha('Valor que você pega', real(estado.valor)) +
          linha('Prazo', estado.meses + ' meses') +
          linha('Taxa usada nesta simulação', p.taxa.toFixed(2).replace('.', ',') + '% ao mês') +
          linha('Total a pagar', real(total));
      }else{
        elNumero.textContent = estado.parcela.toLocaleString('pt-BR');
        var valor = valorDaParcela(estado.parcela, p.taxa, estado.meses);
        var totalP = estado.parcela * estado.meses;
        elResRot.textContent = 'Você conseguiria pegar cerca de';
        elResNum.textContent = real(valor);
        linhas =
          linha('Parcela que você paga', real(estado.parcela)) +
          linha('Prazo', estado.meses + ' meses') +
          linha('Taxa usada nesta simulação', p.taxa.toFixed(2).replace('.', ',') + '% ao mês') +
          linha('Total a pagar', real(totalP));
      }
      elLinhas.innerHTML = linhas;
    }

    function linha(rotulo, valor){
      return '<div class="sim-linha"><span>' + rotulo + '</span><b>' + valor + '</b></div>';
    }

    function trocarModo(modo){
      estado.modo = modo;
      for(var k = 0; k < abas.length; k++){
        abas[k].setAttribute('aria-selected', abas[k].getAttribute('data-modo') === modo ? 'true' : 'false');
      }
      encherFaixa();
      calcular();
    }

    for(var k = 0; k < abas.length; k++){
      abas[k].addEventListener('click', function(){
        trocarModo(this.getAttribute('data-modo'));
      });
    }

    elPerfil.addEventListener('change', function(){
      estado.perfil = this.value;
      encherPrazos();
      encherFaixa();
      calcular();
    });

    elFaixa.addEventListener('input', function(){
      if(estado.modo === 'valor') estado.valor = Number(this.value);
      else estado.parcela = Number(this.value);
      calcular();
    });

    elPrazo.addEventListener('change', function(){
      estado.meses = Number(this.value);
      calcular();
    });

    encherPrazos();
    trocarModo('valor');
  }

  for(var n = 0; n < alvos.length; n++) montar(alvos[n]);
})();
