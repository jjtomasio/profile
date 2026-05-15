//script.js - Script do projeto de perfil pessoal JTO

const linksMenu = document.querySelectorAll('.menu-nav a');
const blocosConteudo = document.querySelectorAll('.bloco-conteudo');
const botaoAlternarTema = document.getElementById('alternar-tema');
const botaoMenuEsquerda = document.getElementById('menu-esquerda');
const botaoMenuDireita = document.getElementById('menu-direita');
const menuNav = document.querySelector('.menu-nav');
const chaveModoTema = 'uc02833_modo_tema';
let temporizadorTemaId = null;

function ativarMenuFixo() {
    document.body.classList.add('menu-fixo');
}

function chegouAoFimDaPagina() {
    const alturaDocumento = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
    );

    return window.innerHeight + window.scrollY >= alturaDocumento - 2;
}

function guardarModoTema(modoNoiteAtivo) {
    try {
        localStorage.setItem(chaveModoTema, modoNoiteAtivo ? 'noite' : 'dia');
    } catch (_erro) {
        // Ignora falhas de armazenamento para nao bloquear o funcionamento da pagina.
    }
}

function lerModoTemaGuardado() {
    try {
        const valorGuardado = localStorage.getItem(chaveModoTema);

        if (valorGuardado === 'noite') {
            return true;
        }

        if (valorGuardado === 'dia') {
            return false;
        }
    } catch (_erro) {
        // Sem acesso ao storage: continua com o comportamento padrao.
    }

    return null;
}

function atualizarBotaoTema(modoNoiteAtivo) {
    if (!botaoAlternarTema) {
        return;
    }

    botaoAlternarTema.textContent = modoNoiteAtivo ? 'Modo dia' : 'Modo noite';
    botaoAlternarTema.setAttribute('aria-pressed', modoNoiteAtivo ? 'true' : 'false');
}

function aplicarTemaNoConteudoIframe(modoNoiteAtivo) {
    const iframe = document.getElementById('janelaConteudo');

    if (!iframe) {
        return;
    }

    try {
        const documentoIframe = iframe.contentDocument;

        if (!documentoIframe || !documentoIframe.body) {
            return;
        }

        documentoIframe.body.classList.toggle('modo-noite', modoNoiteAtivo);
    } catch (_erro) {
        // Ignora erros de acesso ao iframe para manter a navegacao funcional.
    }
}

function prepararSincronizacaoTemaNoIframe() {
    const iframe = document.getElementById('janelaConteudo');

    if (!iframe) {
        return;
    }

    iframe.addEventListener('load', () => {
        aplicarTemaNoConteudoIframe(document.body.classList.contains('modo-noite'));
    });
}

function aplicarTema(modoNoiteAtivo) {
    document.body.classList.toggle('modo-noite', modoNoiteAtivo);
    atualizarBotaoTema(modoNoiteAtivo);
    guardarModoTema(modoNoiteAtivo);
    aplicarTemaNoConteudoIframe(modoNoiteAtivo);
}

function deveAtivarModoNoiteAgora() {
    const agora = new Date();
    const minutosAtuais = (agora.getHours() * 60) + agora.getMinutes();
    const inicioNoite = (20 * 60) + 30;
    const fimNoite = 9 * 60;

    return minutosAtuais >= inicioNoite || minutosAtuais < fimNoite;
}

function atualizarTemaAutomatico() {
    aplicarTema(deveAtivarModoNoiteAgora());
}

function ocultarTodos() {
    blocosConteudo.forEach((bloco) => {
        bloco.classList.remove('ativo');
    });
}

function atualizarHashSemDeslocar(alvoId) {
    if (window.history && typeof window.history.pushState === 'function') {
        window.history.pushState(null, '', alvoId);
        return;
    }

    window.location.hash = alvoId;
}

function obterIndiceLinkPorAlvo(alvoId) {
    return Array.from(linksMenu).findIndex((link) => link.getAttribute('href') === alvoId);
}

function atualizarSetasMenu(indiceAtivo) {
    if (!botaoMenuEsquerda || !botaoMenuDireita) {
        return;
    }

    const indiceAnteriorDisponivel = indiceAtivo > 0;
    const indiceSeguinteDisponivel = indiceAtivo < linksMenu.length - 1;

    botaoMenuEsquerda.hidden = !indiceAnteriorDisponivel;
    botaoMenuDireita.hidden = !indiceSeguinteDisponivel;
}

function atualizarEstadoMenu(alvoId) {
    const indiceAtivo = obterIndiceLinkPorAlvo(alvoId);

    linksMenu.forEach((link, indice) => {
        const ativo = indice === indiceAtivo;

        link.classList.toggle('ativo', ativo);
        if (ativo) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }

        const itemLista = link.parentElement;
        if (itemLista) {
            itemLista.classList.toggle('menu-item-visivel', ativo);
        }
    });

    atualizarSetasMenu(indiceAtivo);
}

function ativarBloco(alvoId) {
    const blocoAlvo = document.querySelector(alvoId);

    if (!blocoAlvo) {
        return false;
    }

    ocultarTodos();
    blocoAlvo.classList.add('ativo');
    atualizarEstadoMenu(alvoId);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return true;
}

function ativarBlocoDoEndereco() {
    const hashAtual = window.location.hash;

    if (hashAtual && ativarBloco(hashAtual)) {
        return;
    }

    // Se nao houver hash valido, mostra a primeira secao.
    if (blocosConteudo.length > 0) {
        const primeiroAlvoId = `#${blocosConteudo[0].id}`;
        ativarBloco(primeiroAlvoId);
    }
}

function navegarNoMenu(direcao) {
    const indiceAtual = obterIndiceLinkPorAlvo(window.location.hash) >= 0
        ? obterIndiceLinkPorAlvo(window.location.hash)
        : Array.from(linksMenu).findIndex((link) => link.classList.contains('ativo'));

    if (indiceAtual < 0) {
        return;
    }

    const proximoIndice = indiceAtual + direcao;

    if (proximoIndice < 0 || proximoIndice >= linksMenu.length) {
        return;
    }

    const proximoAlvo = linksMenu[proximoIndice].getAttribute('href');

    if (ativarBloco(proximoAlvo)) {
        atualizarHashSemDeslocar(proximoAlvo);
    }
}

function configurarNavegacaoPorSwipeMenu() {
    if (!menuNav) {
        return;
    }

    const mediaMobile = window.matchMedia('(max-width: 760px)');
    const limiarSwipe = 45;
    let inicioToqueX = 0;
    let inicioToqueY = 0;
    let arrastoHorizontal = false;

    menuNav.addEventListener('touchstart', (evento) => {
        if (!mediaMobile.matches || evento.touches.length !== 1) {
            return;
        }

        const toque = evento.touches[0];
        inicioToqueX = toque.clientX;
        inicioToqueY = toque.clientY;
        arrastoHorizontal = false;
    }, { passive: true });

    menuNav.addEventListener('touchmove', (evento) => {
        if (!mediaMobile.matches || evento.touches.length !== 1) {
            return;
        }

        const toque = evento.touches[0];
        const deltaX = toque.clientX - inicioToqueX;
        const deltaY = toque.clientY - inicioToqueY;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 12) {
            arrastoHorizontal = true;
        }
    }, { passive: true });

    menuNav.addEventListener('touchend', (evento) => {
        if (!mediaMobile.matches || arrastoHorizontal === false) {
            return;
        }

        const toqueFinal = evento.changedTouches[0];
        if (!toqueFinal) {
            return;
        }

        const deltaX = toqueFinal.clientX - inicioToqueX;
        const deltaY = Math.abs(toqueFinal.clientY - inicioToqueY);

        if (Math.abs(deltaX) < limiarSwipe || deltaY > 80) {
            return;
        }

        if (deltaX < 0) {
            navegarNoMenu(1);
        } else {
            navegarNoMenu(-1);
        }
    }, { passive: true });
}

linksMenu.forEach((link) => {
    link.addEventListener('click', (evento) => {
        evento.preventDefault();
        ativarMenuFixo();

        const alvoId = link.getAttribute('href');
        if (ativarBloco(alvoId)) {
            atualizarHashSemDeslocar(alvoId);
        }
    });
});

if (botaoMenuEsquerda) {
    botaoMenuEsquerda.addEventListener('click', () => {
        navegarNoMenu(-1);
    });
}

if (botaoMenuDireita) {
    botaoMenuDireita.addEventListener('click', () => {
        navegarNoMenu(1);
    });
}

configurarNavegacaoPorSwipeMenu();

if (blocosConteudo.length > 0) {
    window.addEventListener('hashchange', ativarBlocoDoEndereco);
    ativarBlocoDoEndereco();
}

window.addEventListener('scroll', () => {
    if (chegouAoFimDaPagina()) {
        ativarMenuFixo();
    }
}, { passive: true });

if (botaoAlternarTema) {
    botaoAlternarTema.addEventListener('click', () => {
        if (temporizadorTemaId !== null) {
            clearInterval(temporizadorTemaId);
            temporizadorTemaId = null;
        }

        const modoNoiteAtivo = !document.body.classList.contains('modo-noite');
        aplicarTema(modoNoiteAtivo);
    });
}

const modoTemaGuardado = lerModoTemaGuardado();

if (modoTemaGuardado === null) {
    atualizarTemaAutomatico();

    if (botaoAlternarTema) {
        temporizadorTemaId = setInterval(atualizarTemaAutomatico, 30000);
    }
} else {
    aplicarTema(modoTemaGuardado);
}

function atualizarIframePeloHash() {
    const iframe = document.getElementById('janelaConteudo');

    // Esta logica so corre na pagina que contem o iframe de contexto.
    if (!iframe) {
        return;
    }

    const hash = window.location.hash.toLowerCase();

    if (hash === '#readme') {
        iframe.src = 'readme.html';
        return;
    }

    iframe.src = 'guiao.html';
}

prepararSincronizacaoTemaNoIframe();
window.addEventListener('hashchange', atualizarIframePeloHash);
atualizarIframePeloHash();

// Fim do script.js