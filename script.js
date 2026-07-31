/* =========================================================
   VHM STUDIO 3D — script.js
   Estrutura pensada para estudo: cada bloco é independente.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1) LENIS — smooth scroll
     ========================================================= */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !prefersReduced) {
    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      // não intercepta o scroll quando o wheel/touch acontece dentro de um
      // dropdown do combo estado/cidade — assim ele rola sozinho, sem
      // mover a página, não importa onde o cursor esteja depois
      prevent: (node) => !!(node && node.closest && node.closest('.combo-list')),
    });
    window.lenis = lenis;
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // integra Lenis com o ScrollTrigger do GSAP
    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // links âncora usam o Lenis
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.3 });
      });
    });
  }

  /* =========================================================
     2) SCROLL PROGRESS BAR
     ========================================================= */
  const progressBar = document.getElementById('scroll-progress');
  function updateProgress() {
    const scrollY = lenis ? lenis.scroll : window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? scrollY / max : 0;
    progressBar.style.transform = `scaleX(${pct})`;
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  if (lenis) lenis.on('scroll', updateProgress);
  updateProgress();

  /* =========================================================
     2b) NAV: mostra o fundo em onda ao rolar a página
     ========================================================= */
  const navWave = document.getElementById('nav-wave');
  let navWaveVisible = null; // estado atual conhecido (null força a 1ª sincronização)
  let navWaveTicking = false;
  let navWaveHideTimer = null;
  function setNavWave(visible) {
    if (visible === navWaveVisible) return;
    navWaveVisible = visible;
    navWave.classList.toggle('is-visible', navWaveVisible);
  }
  function applyNavWaveState() {
    navWaveTicking = false;
    const scrollY = lenis ? lenis.scroll : window.scrollY;
    if (scrollY > 0) {
      // qualquer scroll fora do topo cancela um "desligar" pendente e liga
      // a nav preta imediatamente
      if (navWaveHideTimer) { clearTimeout(navWaveHideTimer); navWaveHideTimer = null; }
      setNavWave(true);
    } else if (!navWaveHideTimer) {
      // só volta a ficar transparente depois de confirmar, por um pequeno
      // instante, que o scroll realmente parou em 0 — o smooth-scroll
      // (Lenis) passa por valores próximos de 0 durante a desaceleração,
      // e sem esse pequeno atraso a nav "piscava" entre preto e transparente
      navWaveHideTimer = setTimeout(() => {
        navWaveHideTimer = null;
        const stillAtTop = (lenis ? lenis.scroll : window.scrollY) <= 0;
        if (stillAtTop) setNavWave(false);
      }, 120);
    }
  }
  function updateNavScrolled() {
    if (navWaveTicking) return;
    navWaveTicking = true;
    requestAnimationFrame(applyNavWaveState);
  }
  window.addEventListener('scroll', updateNavScrolled, { passive: true });
  if (lenis) lenis.on('scroll', updateNavScrolled);
  updateNavScrolled();

  /* =========================================================
     2.1) MENU HAMBURGER (mobile)
     ========================================================= */
  const navBurger = document.getElementById('nav-burger');
  const navMobileMenu = document.getElementById('nav-mobile-menu');
  if (navBurger && navMobileMenu) {
    function closeMobileMenu() {
      navBurger.setAttribute('aria-expanded', 'false');
      navMobileMenu.classList.remove('is-open');
      navMobileMenu.setAttribute('aria-hidden', 'true');
    }
    function openMobileMenu() {
      navBurger.setAttribute('aria-expanded', 'true');
      navMobileMenu.classList.add('is-open');
      navMobileMenu.setAttribute('aria-hidden', 'false');
    }
    navBurger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navBurger.getAttribute('aria-expanded') === 'true';
      isOpen ? closeMobileMenu() : openMobileMenu();
    });
    // fecha o menu ao clicar em qualquer link dele (o scroll já é
    // tratado pelo listener genérico de a[href^="#"] acima)
    navMobileMenu.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', closeMobileMenu);
    });
    // dropdown pequeno: fecha ao clicar fora dele (comportamento padrão
    // de dropdown, diferente do antigo painel de tela cheia)
    document.addEventListener('click', (e) => {
      const isOpen = navBurger.getAttribute('aria-expanded') === 'true';
      if (isOpen && !navMobileMenu.contains(e.target)) closeMobileMenu();
    });
    // fecha com Esc, por acessibilidade
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    });
  }

  /* =========================================================
     2.2) BOTÃO VOLTAR AO TOPO — some no início da página, aparece
     depois de rolar um pouco, sempre acima do balão do WhatsApp.
     ========================================================= */
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  if (scrollTopBtn) {
    let btnVisible = false;
    function tickScrollTopBtn() {
      // Lê sempre window.scrollY: é o valor real da posição da página,
      // continua correto mesmo durante a animação do Lenis (que também
      // move o scroll nativo) e evita duas fontes de verdade brigando
      // entre si quando a página rola rápido ou volta ao topo.
      const shouldShow = window.scrollY > window.innerHeight * 0.5;
      if (shouldShow !== btnVisible) {
        btnVisible = shouldShow;
        scrollTopBtn.classList.toggle('is-visible', btnVisible);
      }
      requestAnimationFrame(tickScrollTopBtn);
    }
    requestAnimationFrame(tickScrollTopBtn);

    scrollTopBtn.addEventListener('click', () => {
      if (lenis) lenis.scrollTo(0, { duration: 1.3 });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =========================================================
     3) GSAP — registra plugin e roda as animações
     ========================================================= */
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    /* ---- Hero: título entra linha por linha ---- */
    const heroTl = gsap.timeline({ delay: 0.2 });
    heroTl
      .to('.hero-title .line span', {
        y: '0%',
        duration: 0.9,
        stagger: 0.12,
        ease: 'power4.out'
      })
      .to('.hero-sub', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
      .to('.hero-cta', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .to('.hero-ml-float', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3');

    /* ---- Reveal genérico por scroll: qualquer .reveal-wrap > .reveal-inner ---- */
    document.querySelectorAll('.reveal-wrap').forEach((wrap) => {
      const inner = wrap.querySelector('.reveal-inner');
      if (!inner) return;
      gsap.to(inner, {
        y: '0%',
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: wrap,
          start: 'top 88%',
          once: true
        }
      });
    });

    /* ---- Process: cards sobem com leve stagger ao entrar no viewport ---- */
    gsap.utils.toArray('.process-card').forEach((card, i) => {
      gsap.from(card, {
        opacity: 0,
        y: 22,
        duration: 0.7,
        ease: 'power3.out',
        delay: (i % 4) * 0.08,
        scrollTrigger: { trigger: card, start: 'top 88%', once: true }
      });
    });

    /* ---- Work: galeria arrastável (drag) ----
       Nada de scroll-jacking: o card central fica reto/grande e os
       vizinhos aparecem girados e menores, tipo leque de fotos (ver
       rascunho). O usuário arrasta com mouse/touch para trocar o card
       central; cada card tem sua posição-alvo calculada a partir da
       distância (em "slots") até o índice ativo. */
    initWorkGallery();

    /* ---- Materials swatches: leve stagger ---- */
    gsap.utils.toArray('.mat-swatch').forEach((el, i) => {
      gsap.from(el, {
        opacity: 0,
        y: 16,
        duration: 0.6,
        ease: 'power2.out',
        delay: i * 0.04,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    /* ---- Materials: nomes via JSON (dados/materiais.json) ----
       Cada item: { "id": "01", "nome": "PLA laranja" }. Se o arquivo
       não existir (ex.: abrindo direto do disco sem servidor local),
       os nomes padrão já presentes no HTML permanecem. */
    fetch('dados/materiais.json')
      .then((res) => res.json())
      .then((data) => {
        data.forEach((item) => {
          const swatch = document.querySelector(`.mat-swatch[data-id="${item.id}"]`);
          if (!swatch) return;
          const nomeEl = swatch.querySelector('[data-field="nome"]');
          if (nomeEl && item.nome) nomeEl.textContent = item.nome;
        });
      })
      .catch(() => {
        // Sem JSON disponível: mantém os nomes padrão do HTML.
      });
  }

  /* =========================================================
     4) HERO WEBGL — nozzle simplificado desenhando linhas em loop
     Muito mais simples que um crossfade de slideshow: aqui é
     só um plano com shader que desenha "trilhas" de impressão
     em movimento, para não pesar no estudo do efeito principal.
     ========================================================= */
  (function heroWebGL() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!gl) return; // fallback: fica só o fundo sólido, sem quebrar o layout

    const wrap = document.getElementById('hero-canvas-wrap');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = wrap.clientWidth, h = wrap.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const vertSrc = `
      attribute vec2 aPos;
      void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
    `;
    // Shader desenha linhas horizontais deslocadas em diagonal (metáfora do
    // caminho do bico extrusor) com leve granulado — bem mais simples que o
    // shader RGB-shift + noise do site de referência.
    const fragSrc = `
      precision highp float;
      uniform vec2 uRes;
      uniform float uTime;

      float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }

      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;
        float aspect = uRes.x / uRes.y;
        vec2 p = uv;
        p.x *= aspect;

        // linhas de "impressão" com leve ondulação e deslocamento no tempo
        float lines = 0.0;
        float freq = 46.0;
        float speed = uTime * 0.05;
        float wobble = sin(p.x * 6.0 + uTime * 0.3) * 0.01;
        float band = fract((p.y + wobble) * freq * 0.5 - speed);
        float line = smoothstep(0.0, 0.02, band) * smoothstep(1.0, 0.98, band);
        lines = 1.0 - line;

        float grain = (rand(uv * uRes.xy * 0.6 + uTime) - 0.5) * 0.03;

        vec3 base = vec3(0.98, 0.98, 0.97); // --paper
        vec3 accent = vec3(1.0, 0.42, 0.21); // --pla-orange
        vec3 col = mix(base, accent, lines * 0.10);
        col += grain;

        // vinheta suave para não competir com o texto
        float d = distance(uv, vec2(0.5));
        float vig = smoothstep(0.9, 0.35, d);
        col = mix(base, col, vig);

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');

    let raf = 0;
    let running = false;
    let lastDraw = 0;
    const frameInterval = 1000 / 24; // ~24fps: é só um fundo decorativo sutil, não precisa de mais
    const start = performance.now();

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (now - lastDraw < frameInterval) return;
      lastDraw = now;
      const t = (now - start) / 1000;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // só roda enquanto o hero está visível — economiza GPU no resto da página
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !prefersReduced) {
            if (!running) { running = true; raf = requestAnimationFrame(frame); }
          } else {
            running = false;
            if (raf) cancelAnimationFrame(raf);
          }
        });
      }, { threshold: 0.05 });
      obs.observe(document.getElementById('hero'));
    } else if (!prefersReduced) {
      running = true;
      raf = requestAnimationFrame(frame);
    }
  })();

  /* =========================================================
     5) WORK GALLERY — carrossel arrastável tipo leque de fotos
     Card central reto/grande; vizinhos rotacionados e menores,
     ficando mais discretos (menores/mais girados/mais transparentes)
     quanto mais longe do centro. Controlado 100% por arraste
     (mouse/touch), sem depender do scroll da página.
     ========================================================= */
  function initWorkGallery() {
    const stage = document.getElementById('work-stage');
    const track = document.getElementById('work-track');
    if (!stage || !track) return;

    const cards = Array.from(track.querySelectorAll('.work-card'));
    const dots = Array.from(document.querySelectorAll('#work-progress .dot'));
    const N = cards.length;
    if (!N) return;

    // ---- Cor predominante de cada imagem, aplicada no frame (moldura) ----
    // Faz o "cartão de trás" herdar a cor média da foto, em vez de ficar
    // sempre branco. Usa canvas pra amostrar os pixels da imagem.
    // A mesma cor também alimenta o fundo animado da seção (work-bg), que
    // é atualizado sempre que o card central muda (ver updateWorkBg abaixo).
    const dominantColors = {}; // cardId -> { r, g, b }

    function pastelVariant(r, g, b, mix) {
      const soften = (c) => Math.round(c + (255 - c) * mix);
      return `rgb(${soften(r)}, ${soften(g)}, ${soften(b)})`;
    }

    // Escurece levemente a cor dominante quando ela é clara demais, pra a
    // linha (.work-info-line) continuar visível sobre o fundo claro da seção.
    function accentVariant(r, g, b) {
      const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (luma <= 0.72) return `rgb(${r}, ${g}, ${b})`;
      const darken = (c) => Math.round(c * 0.72);
      return `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
    }

    const workSection = document.getElementById('work');

    function updateWorkBg(cardId) {
      const c = dominantColors[cardId];
      if (!c) return;
      // Cor pastel bem clara derivada da cor dominante da imagem em destaque,
      // aplicada como fundo sólido da seção (sem blobs nem luzes animadas).
      if (workSection) {
        workSection.style.setProperty('--work-bg-c1', pastelVariant(c.r, c.g, c.b, 0.82));
      }

      // A linha decorativa acima de Peça/Material/Medidas/Peso passa a usar
      // a mesma cor dominante da imagem em destaque, em vez do laranja fixo.
      // Consulta o DOM diretamente (em vez de reusar a variável infoBoxes,
      // declarada mais abaixo neste arquivo) para não depender da ordem de
      // execução entre a amostragem assíncrona da imagem e essa declaração.
      const accent = accentVariant(c.r, c.g, c.b);
      document.querySelectorAll('.work-info').forEach((box) => {
        box.style.setProperty('--info-accent', accent);
      });
      // Mesma cor de destaque também no bloco mobile (grid 2x2 que substitui
      // os cartões flutuantes em telas menores) — antes ficava só no laranja
      // fixo por não receber essa variável.
      const mobileBlock = document.getElementById('work-info-mobile');
      if (mobileBlock) mobileBlock.style.setProperty('--info-accent', accent);
    }

    function applyDominantColor(card) {
      const img = card.querySelector('.work-card-img img');
      const frame = card.querySelector('.work-card-frame');
      if (!img || !frame) return;

      function sample() {
        try {
          const canvas = document.createElement('canvas');
          const SIZE = 32; // amostragem pequena é suficiente e rápida
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, SIZE, SIZE);
          const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

          let r = 0, g = 0, b = 0, count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha < 200) continue; // ignora pixels transparentes/quase transparentes
            const rr = data[i], gg = data[i + 1], bb = data[i + 2];
            // ignora quase-branco e quase-preto puros (fundo/contorno), foca na cor real
            const isNearWhite = rr > 245 && gg > 245 && bb > 245;
            const isNearBlack = rr < 12 && gg < 12 && bb < 12;
            if (isNearWhite || isNearBlack) continue;
            r += rr; g += gg; b += bb; count++;
          }
          if (!count) return; // imagem só branco/preto/transparente: mantém o frame padrão

          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);

          // Versão suave (mesclada com branco) para não ficar saturado demais
          const soften = (c) => Math.round(c + (255 - c) * 0.55);
          const sr = soften(r), sg = soften(g), sb = soften(b);

          frame.style.background = `rgb(${sr}, ${sg}, ${sb})`;
          card.style.setProperty('--dominant-color', `rgb(${r}, ${g}, ${b})`);

          dominantColors[card.dataset.id] = { r, g, b };
          if (card.classList.contains('is-center')) updateWorkBg(card.dataset.id);
        } catch (err) {
          // CORS ou outra falha ao ler pixels: silenciosamente mantém o branco padrão
        }
      }

      if (img.complete && img.naturalWidth) sample();
      else img.addEventListener('load', sample, { once: true });
    }

    cards.forEach(applyDominantColor);

    // Formata as medidas em uma linha por medida, sem separador "|":
    // Altura 9cm
    // Largura 7cm
    // Profundidade 6cm
    // Aceita o formato novo (array: ["Altura 9cm", "Largura 7cm", ...])
    // e mantém compatibilidade com o formato antigo (string "altura 9cm | largura 7cm | ...").
    function formatMedidas(data) {
      if (!data) return '—';
      const parts = Array.isArray(data)
        ? data.map((p) => String(p).trim()).filter(Boolean)
        : String(data).split('|').map((p) => p.trim()).filter(Boolean);
      if (!parts.length) return '—';
      return parts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .map((part) => `<span class="work-info-measure-line">${part}</span>`)
        .join('');
    }

    // ---- Textos com dados da peça central (via JSON) ----
    let piecesData = null;
    let lastInfoIdx = null;
    const infoEls = {
      nome: document.querySelector('#work-info-tl [data-field="nome"]'),
      material: document.querySelector('#work-info-tr [data-field="material"]'),
      medidas: document.querySelector('#work-info-bl [data-field="medidas"]'),
      peso: document.querySelector('#work-info-br [data-field="peso"]'),
    };
    const infoBoxes = Array.from(document.querySelectorAll('.work-info'));
    const mobileInfoEls = {
      nome: document.querySelector('#work-info-mobile [data-field="nome"]'),
      material: document.querySelector('#work-info-mobile [data-field="material"]'),
      medidas: document.querySelector('#work-info-mobile [data-field="medidas"]'),
      peso: document.querySelector('#work-info-mobile [data-field="peso"]'),
    };

    fetch('dados/trabalhos.json')
      .then((res) => res.json())
      .then((data) => {
        piecesData = data;
        updateInfo(true);
      })
      .catch(() => {
        // Sem JSON disponível (ex.: abrindo o arquivo direto do disco sem
        // servidor local) — os textos flutuantes simplesmente não aparecem.
      });

    function updateInfo(force) {
      const idx = ((Math.round(active) % N) + N) % N;
      if (!force && idx === lastInfoIdx) return;
      lastInfoIdx = idx;

      const cardId = cards[idx] && cards[idx].dataset.id;
      updateWorkBg(cardId);

      if (!piecesData) return;

      const piece = piecesData.find((p) => p.id === cardId);
      if (!piece) {
        infoBoxes.forEach((box) => box.classList.remove('is-visible'));
        return;
      }

      if (infoEls.nome) infoEls.nome.textContent = piece.nome || '—';
      if (infoEls.material) infoEls.material.textContent = piece.material || '—';
      if (infoEls.medidas) infoEls.medidas.innerHTML = formatMedidas(piece.medidas);
      if (infoEls.peso) infoEls.peso.textContent = piece.peso || '—';

      if (mobileInfoEls.nome) mobileInfoEls.nome.textContent = piece.nome || '—';
      if (mobileInfoEls.material) mobileInfoEls.material.textContent = piece.material || '—';
      if (mobileInfoEls.medidas) mobileInfoEls.medidas.innerHTML = formatMedidas(piece.medidas);
      if (mobileInfoEls.peso) mobileInfoEls.peso.textContent = piece.peso || '—';

      infoBoxes.forEach((box) => box.classList.add('is-visible'));

      // Reinicia a animação da linha + textos a cada troca de card: remove
      // a classe e reaplica no frame seguinte, para que a transição de
      // width/opacity comece do zero em vez de "pular" direto pro estado
      // final quando o card muda rápido. O reflow forçado (offsetWidth) foi
      // removido daqui: ele era síncrono e caro bem no meio do drag; como o
      // navegador já faz um layout entre o remove e o add de classe através
      // de dois requestAnimationFrame, o efeito visual continua o mesmo.
      infoBoxes.forEach((box) => box.classList.remove('is-revealing'));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          infoBoxes.forEach((box) => box.classList.add('is-revealing'));
        });
      });
    }

    // Configuração visual do "leque": deslocamento horizontal, rotação
    // e escala de cada card em função da distância até o índice ativo.
    // Deslocamento horizontal entre slots: menor em telas pequenas, para
    // os cards vizinhos não saírem tanto da viewport em mobile.
    function getSlotW() {
      const w = window.innerWidth;
      if (w <= 600) return 170;
      if (w <= 900) return 230;
      return 350;
    }
    let SLOT_W = getSlotW();
    window.addEventListener('resize', () => { SLOT_W = getSlotW(); }, { passive: true });
    const ROT_STEP = 10;     // graus de rotação por slot
    const SCALE_STEP = 0.24; // redução de escala por slot (cards vizinhos bem menores que o central)
    const OPACITY_STEP = 0.35;
    const MAX_VISIBLE_DIST = 3; // além disso, fica invisível
    const CENTER_POP_Z = 140;   // px que o card central "salta" pra frente (translateZ)
    const DEPTH_STEP = 60;      // px de profundidade que cada card recua por slot

    // Escala da FOTO dentro do card (não do card em si): no centro ela
    // "estoura" pra fora da moldura, nas laterais fica recuada. Interpolamos
    // entre esses dois valores conforme a distância até o centro, em vez de
    // aplicar via CSS só quando .is-center é alcançado — assim o crescimento
    // acontece de forma contínua durante a transição, não só no instante em
    // que o card vira central. Os pares (central, lateral) variam por
    // largura de tela, replicando os valores que antes ficavam fixos nas
    // media queries do CSS.
    function getImgScales() {
      const w = window.innerWidth;
      if (w <= 420) return { center: 1.05, side: 0.95 };
      if (w <= 700) return { center: 1.15, side: 0.98 };
      return { center: 1.25, side: 1.02 };
    }
    let imgScales = getImgScales();
    window.addEventListener('resize', () => { imgScales = getImgScales(); }, { passive: true });
    // Referência cacheada de .work-card-img de cada card (mesma ordem de `cards`),
    // pra não fazer querySelector dentro do loop de render a cada frame.
    const cardImgs = cards.map((card) => card.querySelector('.work-card-img'));

    let active = 0;          // índice do card central (pode ser fracionário durante o drag)
    let dragging = false;
    let moved = false;       // virou drag de verdade (passou do threshold)?
    let startX = 0;
    let startActive = 0;
    let pointerId = null;
    const DRAG_THRESHOLD = 6; // px — abaixo disso, tratamos como clique
    let rafPending = false;  // throttle de render durante o drag

    // Cache do índice central anterior: dá pra pular por completo o toggle
    // de classes/dots/updateInfo quando o card em destaque não mudou entre
    // dois frames — o caso comum durante o drag, que dispara render()
    // dezenas de vezes por segundo mas só troca de "vencedor" às vezes.
    let lastCenterIdx = null;

    function render() {
      cards.forEach((card, i) => {
        let dist = i - active;

        // Normaliza pelo caminho mais curto (efeito "carrossel" infinito visual)
        if (dist > N / 2) dist -= N;
        if (dist < -N / 2) dist += N;

        const absDist = Math.abs(dist);

        // Fora do alcance visível: só zera a opacidade (se ainda não estiver
        // zerada) e pula o resto — evita recalcular transform/zIndex/classe
        // de cards que o usuário não está vendo mesmo.
        if (absDist > MAX_VISIBLE_DIST) {
          if (card.style.opacity !== '0') card.style.opacity = 0;
          return;
        }

        const x = dist * SLOT_W;
        const rot = dist * ROT_STEP;
        const scale = Math.max(1 - absDist * SCALE_STEP, 0.4);
        const opacity = Math.max(1 - absDist * OPACITY_STEP, 0);
        const z = 100 - Math.round(absDist * 10);

        // Profundidade 3D real: o card central "salta" pra frente (Z positivo,
        // maior) e recua conforme se afasta — a imagem principal sobrepõe
        // fisicamente os cards ao redor, não só por opacidade/z-index 2D.
        const depthZ = CENTER_POP_Z - absDist * DEPTH_STEP;

        card.style.transform =
          `translate(-50%, -50%) translateX(${x}px) translateZ(${depthZ}px) rotate(${rot}deg) scale(${scale})`;
        card.style.opacity = opacity;
        card.style.zIndex = z;
        card.classList.toggle('is-center', absDist < 0.5);

        // Crescimento da foto proporcional à distância: em absDist=0 é
        // IMG_SCALE_CENTER, a partir de absDist=1 (já um slot de distância)
        // é IMG_SCALE_SIDE — clampado pra não continuar encolhendo depois disso.
        const imgT = Math.min(absDist, 1); // 0 = centro, 1 = já é vizinho
        const imgScale = imgScales.center + (imgScales.side - imgScales.center) * imgT;
        const imgEl = cardImgs[i];
        if (imgEl) {
          imgEl.style.transform = `scale(${imgScale})`;
          imgEl.style.setProperty('--img-scale', imgScale);
        }
      });

      const idx = ((Math.round(active) % N) + N) % N;
      if (idx !== lastCenterIdx) {
        lastCenterIdx = idx;
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === idx));
        updateInfo(false);
      }
    }

    // Durante o drag, agrupa os pointermove no próximo frame do navegador
    // em vez de escrever no DOM a cada evento — evita o engasgo, já que
    // o pointermove pode disparar mais rápido do que a tela redesenha.
    function scheduleRender() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        render();
      });
    }

    // Anima suavemente de um valor "active" para outro (usado ao soltar o drag ou clicar).
    // Enquanto o tween está rodando, isAnimating fica true e bloqueia novos
    // cliques/drags — o card central precisa terminar de chegar ao centro
    // antes de aceitar a próxima navegação. Isso evita o "travamento" visual
    // de interromper a animação no meio do caminho repetidamente.
    let tweenState = { v: 0 };
    let isAnimating = false;

    function animateTo(target) {
      if (isAnimating) return;
      tweenState.v = active;
      if (window.gsap) {
        isAnimating = true;
        gsap.killTweensOf(tweenState);
        gsap.to(tweenState, {
          v: target,
          duration: 0.6,
          ease: 'back.out(1.4)',
          onUpdate: () => {
            active = tweenState.v;
            render();
          },
          onComplete: () => {
            active = ((Math.round(target) % N) + N) % N;
            render();
            isAnimating = false;
          }
        });
      } else {
        active = ((Math.round(target) % N) + N) % N;
        render();
      }
    }

    let downTarget = [];

    function onPointerDown(e) {
      // Bloqueia início de um novo drag/clique enquanto o card central
      // ainda está em movimento até completar a posição.
      if (isAnimating) return;
      dragging = true;
      moved = false;
      pointerId = e.pointerId;

      // Como os cards se sobrepõem (efeito leque), o card do topo (maior
      // z-index) pode tampar visualmente outro card mais atrás. Por isso,
      // olhamos TODOS os elementos sob o ponteiro nesse ponto, não só o
      // primeiro — e guardamos a lista para escolher o certo no pointerup.
      downTarget = document.elementsFromPoint(e.clientX, e.clientY)
        .map(el => el.closest('.work-card'))
        .filter(Boolean);

      stage.setPointerCapture(pointerId);
      startX = e.clientX;
      startActive = active;
      if (window.lenis) window.lenis.stop();
    }

    function onPointerMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > DRAG_THRESHOLD) {
        moved = true;
        stage.classList.add('is-dragging');
      }
      if (!moved) return;
      active = startActive - dx / SLOT_W;
      scheduleRender();
    }

    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      if (pointerId !== null) {
        try { stage.releasePointerCapture(pointerId); } catch (err) {}
      }

      if (moved) {
        // foi um arraste de verdade: encaixa no card mais próximo
        const nearest = Math.round(active);
        animateTo(nearest);
      } else {
        // não moveu o suficiente: trata como CLIQUE. Entre os cards que
        // estavam sobrepostos nesse ponto (downTarget), escolhe o que
        // estiver mais na frente visualmente (mais próximo do centro,
        // já que tem z-index maior) — permite pular para qualquer
        // distância (-2, +2, etc.), não só vizinho imediato.
        const centerIdx = ((Math.round(active) % N) + N) % N;
        let chosen = null;
        let chosenAbsDist = Infinity;

        for (const target of downTarget) {
          const i = cards.indexOf(target);
          if (i === -1) continue;
          let dist = i - centerIdx;
          if (dist > N / 2) dist -= N;
          if (dist < -N / 2) dist += N;
          if (dist === 0) continue; // já é o card central, nada a fazer
          if (Math.abs(dist) < chosenAbsDist) {
            chosenAbsDist = Math.abs(dist);
            chosen = centerIdx + dist;
          }
        }

        if (chosen !== null) animateTo(chosen);
      }
      moved = false;
      downTarget = [];
      if (window.lenis) window.lenis.start();
    }

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);
    stage.addEventListener('pointerleave', (e) => { if (dragging) onPointerUp(e); });

    // Clique nos dots navega direto
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => animateTo(i));
    });

    // Evita que o navegador tente arrastar as imagens nativamente
    track.querySelectorAll('img').forEach(img => {
      img.addEventListener('dragstart', (e) => e.preventDefault());
    });

    render();
  }

  // =========================================================
  // VIDEOS — troca de vídeo em destaque + som + play/pause +
  // barra de progresso (estilo YouTube) + pausa automática quando
  // a seção sai da tela ou a aba perde o foco
  // =========================================================
  (function initVideos() {
    const stage = document.getElementById('video-stage');
    const mainVideo = document.getElementById('video-main');
    const mainTitle = document.getElementById('video-main-title');
    const mainTag = document.getElementById('video-main-tag');
    const soundBtn = document.getElementById('video-sound-btn');
    const soundIcon = document.getElementById('video-sound-icon');
    const timeLabel = document.getElementById('video-time');
    const progressBar = document.getElementById('video-progress-bar');
    const progressTrack = progressBar ? progressBar.querySelector('.video-progress-track') : null;
    const progressFilled = document.getElementById('video-progress-filled');
    const progressBuffered = document.getElementById('video-progress-buffered');
    const progressThumb = document.getElementById('video-progress-thumb');
    const thumbs = Array.from(document.querySelectorAll('.video-thumb'));
    const centerIcon = document.getElementById('video-center-icon');
    const centerIconSvg = document.getElementById('video-center-icon-svg');
    if (!stage || !mainVideo || !thumbs.length) return;

    const ICON_MUTED = '<path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
    const ICON_UNMUTED = '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>';
    const ICON_CENTER_PAUSE = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>';
    const ICON_CENTER_PLAY = '<path d="M8 5v14l11-7z"/>';
    let centerIconTimer = null;
    // mostra o ícone de play/pause no centro do vídeo por um instante,
    // como feedback do clique — depois desaparece sozinho
    function flashCenterIcon(paused) {
      if (!centerIcon || !centerIconSvg) return;
      centerIconSvg.innerHTML = paused ? ICON_CENTER_PLAY : ICON_CENTER_PAUSE;
      centerIcon.classList.remove('is-flashing');
      // força reflow para reiniciar a transição caso já estivesse visível
      void centerIcon.offsetWidth;
      centerIcon.classList.add('is-flashing');
      if (centerIconTimer) clearTimeout(centerIconTimer);
      centerIconTimer = setTimeout(() => {
        centerIcon.classList.remove('is-flashing');
      }, 550);
    }

    // Controla se o usuário pausou manualmente — nesse caso o vídeo não
    // deve voltar a tocar sozinho ao reentrar na viewport/aba.
    let userPaused = false;
    let inViewport = false;
    let pageVisible = document.visibilityState !== 'hidden';
    let isDragging = false;

    function fmtTime(sec) {
      if (!isFinite(sec) || sec < 0) sec = 0;
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }

    function attemptPlay() {
      if (userPaused || !inViewport || !pageVisible) return;
      mainVideo.play().catch(() => {});
    }

    function forcePause() {
      mainVideo.pause();
    }

    function updateProgress() {
      if (isDragging) return;
      const duration = mainVideo.duration || 0;
      const pct = duration ? (mainVideo.currentTime / duration) * 100 : 0;
      if (progressFilled) progressFilled.style.width = pct + '%';
      if (progressThumb) progressThumb.style.left = pct + '%';
      if (timeLabel) timeLabel.textContent = `${fmtTime(mainVideo.currentTime)} / ${fmtTime(duration)}`;
      if (progressBuffered && mainVideo.buffered.length) {
        try {
          const bufferedEnd = mainVideo.buffered.end(mainVideo.buffered.length - 1);
          const bufPct = duration ? (bufferedEnd / duration) * 100 : 0;
          progressBuffered.style.width = bufPct + '%';
        } catch (e) { /* ignora se não houver ranges válidos */ }
      }
    }

    function seekFromClientX(clientX) {
      if (!progressBar) return;
      // Usa o retângulo da TRILHA (.video-progress-track), não do wrapper
      // clicável (.video-progress-bar) — o wrapper tem padding extra pra
      // aumentar a área de clique, e usar o rect dele fazia o clique na
      // borda esquerda/direita calcular uma posição errada (deslocada).
      const rect = (progressTrack || progressBar).getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const duration = mainVideo.duration || 0;
      if (duration) mainVideo.currentTime = ratio * duration;
      if (progressFilled) progressFilled.style.width = (ratio * 100) + '%';
      if (progressThumb) progressThumb.style.left = (ratio * 100) + '%';
    }

    mainVideo.addEventListener('timeupdate', updateProgress);
    mainVideo.addEventListener('loadedmetadata', updateProgress);
    mainVideo.addEventListener('progress', updateProgress);
    // Ao terminar, avança automaticamente para o próximo vídeo da lista
    // (volta ao primeiro depois do último).
    mainVideo.addEventListener('ended', () => {
      const activeIndex = thumbs.findIndex((t) => t.classList.contains('is-active'));
      const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % thumbs.length : 0;
      selectThumb(thumbs[nextIndex]);
    });

    // Barra de progresso: clique para pular, arraste para "scrubar"
    if (progressBar) {
      progressBar.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isDragging = true;
        progressBar.classList.add('is-dragging');
        seekFromClientX(e.clientX);
      });
      progressBar.addEventListener('touchstart', (e) => {
        isDragging = true;
        progressBar.classList.add('is-dragging');
        seekFromClientX(e.touches[0].clientX);
      }, { passive: true });

      window.addEventListener('mousemove', (e) => {
        if (isDragging) seekFromClientX(e.clientX);
      });
      window.addEventListener('touchmove', (e) => {
        if (isDragging) seekFromClientX(e.touches[0].clientX);
      }, { passive: true });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          progressBar.classList.remove('is-dragging');
        }
      });
      window.addEventListener('touchend', () => {
        if (isDragging) {
          isDragging = false;
          progressBar.classList.remove('is-dragging');
        }
      });
    }

    function selectThumb(thumb, { restart } = { restart: true }) {
      thumbs.forEach((t) => t.classList.toggle('is-active', t === thumb));
      const src = thumb.dataset.src;
      if (mainVideo.getAttribute('src') !== src) {
        mainVideo.setAttribute('src', src);
        if (restart) {
          mainVideo.currentTime = 0;
          userPaused = false;
          attemptPlay();
        }
      }
      if (mainTitle) mainTitle.textContent = thumb.dataset.title || '';
      if (mainTag) mainTag.textContent = thumb.dataset.tag || '';
    }

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => selectThumb(thumb));
    });

    // Miniaturas: força o carregamento do primeiro frame de cada vídeo
    // para servir de "capa" (thumbnail), já que não usamos mais poster.jpg
    document.querySelectorAll('.video-thumb-frame video').forEach((v) => {
      v.addEventListener('loadeddata', () => { v.currentTime = 0.1; }, { once: true });
    });

    // Botão liga/desliga o áudio do vídeo em destaque. Fica mudo por
    // padrão (autoplay só funciona em navegadores com muted=true).
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const nextMuted = !mainVideo.muted;
        mainVideo.muted = nextMuted;
        if (!nextMuted) attemptPlay();
        soundBtn.setAttribute('aria-pressed', String(!nextMuted));
        soundBtn.setAttribute('aria-label', nextMuted ? 'Ativar som' : 'Silenciar');
        if (soundIcon) soundIcon.innerHTML = nextMuted ? ICON_MUTED : ICON_UNMUTED;
      });
    }

    // Clique no próprio vídeo pausa/retoma — substitui o antigo botão de
    // play/pause fixo. Se o usuário pausar manualmente, o vídeo permanece
    // pausado mesmo que a seção continue visível.
    mainVideo.addEventListener('click', () => {
      if (mainVideo.paused) {
        userPaused = false;
        attemptPlay();
        flashCenterIcon(false); // ícone de pause: acabou de dar play
      } else {
        userPaused = true;
        forcePause();
        flashCenterIcon(true); // ícone de play: acabou de pausar
      }
    });

    updateProgress();

    // Pausa o vídeo em destaque quando a seção sai da tela — evita manter
    // um <video> rodando fora da viewport sem necessidade. Considera a
    // seção "fora de vista" com uma margem generosa, funcionando mesmo em
    // seções mais altas que a viewport (o threshold sozinho não bastava).
    if ('IntersectionObserver' in window) {
      const section = document.getElementById('videos');
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          inViewport = entry.isIntersecting;
          if (inViewport) {
            attemptPlay();
          } else {
            forcePause();
          }
        });
      }, { threshold: 0, rootMargin: '-10% 0px -10% 0px' });
      if (section) obs.observe(section);
    } else {
      // Sem suporte a IntersectionObserver: assume visível e deixa o
      // autoplay padrão do navegador decidir.
      inViewport = true;
    }

    // Pausa também quando o usuário troca de aba/minimiza a janela, e
    // retoma ao voltar (se ainda estiver na seção e não pausado manualmente).
    document.addEventListener('visibilitychange', () => {
      pageVisible = document.visibilityState !== 'hidden';
      if (pageVisible) {
        attemptPlay();
      } else {
        forcePause();
      }
    });
  })();

  // =========================================================
  // FORMULÁRIO DE CONTATO — máscara de celular + combo
  // inteligente de estado/cidade (digitar ou escolher na lista,
  // cidades filtradas pelo estado selecionado)
  // =========================================================
  (function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    // ---- dados de estados/cidades via API do IBGE, com fallback
    //      mínimo (apenas nomes dos estados) caso a API esteja
    //      indisponível — nesse caso as cidades ficam em texto livre ----
    const IBGE_STATES_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome';
    const IBGE_CITIES_URL = (uf) => `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`;

    const FALLBACK_STATE_NAMES = [
      'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
      'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
      'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
      'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
      'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
    ];

    let STATE_NAMES = FALLBACK_STATE_NAMES;
    let STATE_UF_BY_NAME = {};   // "São Paulo" -> "SP"
    const CITY_CACHE = {};       // "SP" -> ["Adamantina", ...]

    async function loadStates() {
      try {
        const res = await fetch(IBGE_STATES_URL);
        if (!res.ok) throw new Error('IBGE states request failed');
        const data = await res.json();
        const names = [];
        const ufMap = {};
        data.forEach((uf) => {
          names.push(uf.nome);
          ufMap[uf.nome] = uf.sigla;
        });
        if (names.length) {
          STATE_NAMES = names;
          STATE_UF_BY_NAME = ufMap;
        }
      } catch (err) {
        // API indisponível: mantém a lista mínima de fallback (sem cidades)
        console.warn('IBGE: falha ao carregar estados, usando lista local.', err);
      }
    }

    async function loadCitiesForState(stateName) {
      const uf = STATE_UF_BY_NAME[stateName];
      if (!uf) {
        // sem UF (API indisponível): sem lista de cidades para validar
        return [];
      }
      if (CITY_CACHE[uf]) return CITY_CACHE[uf];
      try {
        const res = await fetch(IBGE_CITIES_URL(uf));
        if (!res.ok) throw new Error('IBGE cities request failed');
        const data = await res.json();
        const cities = data.map((c) => c.nome);
        CITY_CACHE[uf] = cities;
        return cities;
      } catch (err) {
        console.warn(`IBGE: falha ao carregar cidades de ${stateName}.`, err);
        return [];
      }
    }

    // dispara o carregamento dos estados assim que o form inicializa
    const statesReady = loadStates();

    // ---- máscara de celular: (00) 00000-0000 / (00) 0000-0000 ----
    const celularInput = document.getElementById('cf-celular');
    if (celularInput) {
      celularInput.addEventListener('input', () => {
        let v = celularInput.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 10) {
          v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        } else if (v.length > 6) {
          v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if (v.length > 2) {
          v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        } else if (v.length > 0) {
          v = v.replace(/(\d{0,2})/, '($1');
        }
        celularInput.value = v.replace(/-$/, '').replace(/\)\s$/, ')');
      });
      celularInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && /[\s()-]$/.test(celularInput.value)) {
          e.preventDefault();
          celularInput.value = celularInput.value.slice(0, -1).replace(/[\s()-]+$/, '');
        }
      });
    }

    // ---- combo genérico: digitar OU escolher num dropdown ----
    // getOptions pode retornar um array OU uma Promise<array> (usado
    // para buscar as cidades do IBGE sob demanda)
    function setupCombo({ wrapId, inputId, listId, getOptions, onSelect, onInput }) {
      const wrap = document.getElementById(wrapId);
      const input = document.getElementById(inputId);
      const list = document.getElementById(listId);
      const toggle = wrap ? wrap.querySelector('.combo-toggle') : null;
      if (!wrap || !input || !list) return null;

      let activeIndex = -1;
      let renderToken = 0;

      // trava extra além da opção "prevent" do Lenis: garante que a roda
      // do mouse sobre o dropdown role só a lista, nunca a página —
      // rola manualmente e impede a propagação do evento
      list.addEventListener('wheel', (e) => {
        const atTop = list.scrollTop === 0;
        const atBottom = Math.ceil(list.scrollTop + list.clientHeight) >= list.scrollHeight;
        if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
          e.preventDefault();
        }
        list.scrollTop += e.deltaY;
        e.stopPropagation();
      }, { passive: false });

      function renderOptions(options, filterText) {
        const filtered = filterText
          ? options.filter((o) => o.toLowerCase().includes(filterText.toLowerCase()))
          : options;

        list.innerHTML = '';
        if (!filtered.length) {
          wrap.classList.remove('is-open');
          return;
        }
        filtered.forEach((opt) => {
          const item = document.createElement('div');
          item.className = 'combo-option';
          item.setAttribute('role', 'option');
          item.textContent = opt;
          item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            input.value = opt;
            wrap.classList.remove('is-open');
            if (onSelect) onSelect(opt);
          });
          list.appendChild(item);
        });
        activeIndex = -1;
        wrap.classList.add('is-open');
      }

      // getOptions() pode devolver array direto ou uma Promise (ex.: busca
      // de cidades no IBGE). Enquanto a Promise não resolve, mostramos um
      // item de "carregando..." no lugar da lista.
      function renderList(filterText) {
        const myToken = ++renderToken;
        const result = getOptions();

        if (result && typeof result.then === 'function') {
          list.innerHTML = '<div class="combo-option combo-option-loading">Carregando…</div>';
          wrap.classList.add('is-open');
          result.then((options) => {
            if (myToken !== renderToken) return; // resposta obsoleta, ignora
            renderOptions(options || [], filterText);
          });
        } else {
          renderOptions(result || [], filterText);
        }
      }

      function openList() { renderList(input.value.trim()); }
      function closeList() { wrap.classList.remove('is-open'); }

      input.addEventListener('focus', openList);
      input.addEventListener('input', () => {
        renderList(input.value.trim());
        if (onInput) onInput(input.value.trim());
      });
      input.addEventListener('blur', () => {
        setTimeout(closeList, 120);
      });
      input.addEventListener('keydown', (e) => {
        const items = Array.from(list.querySelectorAll('.combo-option'));
        if (!items.length) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          activeIndex = Math.min(activeIndex + 1, items.length - 1);
          items.forEach((it, i) => it.classList.toggle('is-active', i === activeIndex));
          items[activeIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          activeIndex = Math.max(activeIndex - 1, 0);
          items.forEach((it, i) => it.classList.toggle('is-active', i === activeIndex));
          items[activeIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
          if (activeIndex >= 0 && items[activeIndex]) {
            e.preventDefault();
            input.value = items[activeIndex].textContent;
            closeList();
            if (onSelect) onSelect(input.value);
          }
        } else if (e.key === 'Escape') {
          closeList();
        }
      });

      if (toggle) {
        toggle.addEventListener('click', () => {
          if (wrap.classList.contains('is-open')) {
            closeList();
          } else {
            input.focus();
            openList();
          }
        });
      }

      document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) closeList();
      });

      return { renderList, closeList };
    }

    const cidadeInput = document.getElementById('cf-cidade');

    // agora assíncrono: busca no cache, ou no IBGE, ou no fallback local
    function citiesForState(stateName) {
      return loadCitiesForState(stateName);
    }

    function findStateMatch(text) {
      const norm = text.trim().toLowerCase();
      return STATE_NAMES.find((s) => s.toLowerCase() === norm) || null;
    }

    async function updateCidadeAvailability(stateName) {
      if (!cidadeInput) return;
      if (!stateName) {
        cidadeInput.disabled = true;
        cidadeInput.value = '';
        cidadeInput.placeholder = 'Selecione o estado primeiro';
        return;
      }
      cidadeInput.disabled = true;
      cidadeInput.placeholder = 'Carregando cidades…';
      const cities = await citiesForState(stateName);
      // evita condição de corrida se o usuário já trocou de estado
      const estadoInput = document.getElementById('cf-estado');
      const stillMatches = estadoInput && findStateMatch(estadoInput.value) === stateName;
      if (!stillMatches) return;
      if (cities.length) {
        cidadeInput.disabled = false;
        cidadeInput.placeholder = 'Digite ou escolha a cidade';
      } else {
        cidadeInput.disabled = true;
        cidadeInput.value = '';
        cidadeInput.placeholder = 'Selecione o estado primeiro';
      }
    }

    // garante que a lista de estados (IBGE) esteja carregada antes de
    // abrir o combo pela primeira vez
    setupCombo({
      wrapId: 'combo-estado',
      inputId: 'cf-estado',
      listId: 'combo-estado-list',
      getOptions: () => statesReady.then(() => STATE_NAMES),
      onSelect: (value) => {
        if (cidadeInput) cidadeInput.value = '';
        updateCidadeAvailability(value);
      },
      onInput: (value) => {
        const matched = findStateMatch(value);
        if (matched) {
          if (cidadeInput) cidadeInput.value = '';
          updateCidadeAvailability(matched);
        } else {
          updateCidadeAvailability(null);
        }
      }
    });

    setupCombo({
      wrapId: 'combo-cidade',
      inputId: 'cf-cidade',
      listId: 'combo-cidade-list',
      getOptions: () => {
        const estadoInput = document.getElementById('cf-estado');
        const matched = estadoInput ? findStateMatch(estadoInput.value) : null;
        return matched ? citiesForState(matched) : Promise.resolve([]);
      }
    });

    updateCidadeAvailability(null);

    form.addEventListener('submit', async (e) => {
      const estadoInput = document.getElementById('cf-estado');
      const matched = estadoInput ? findStateMatch(estadoInput.value) : null;
      if (estadoInput && !matched) {
        e.preventDefault();
        estadoInput.classList.add('is-invalid');
        estadoInput.focus();
        setTimeout(() => estadoInput.classList.remove('is-invalid'), 1500);
        return;
      }
      if (cidadeInput && matched) {
        // impede o envio até confirmarmos a cidade contra a lista do IBGE
        e.preventDefault();
        const validCities = await citiesForState(matched);
        if (validCities.length && !validCities.includes(cidadeInput.value.trim())) {
          cidadeInput.classList.add('is-invalid');
          cidadeInput.focus();
          setTimeout(() => cidadeInput.classList.remove('is-invalid'), 1500);
          return;
        }
        form.submit();
      }
    });
  })();

  /* =========================================================
     COOKIE BANNER
     ========================================================= */
  (function cookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    const STORAGE_KEY = 'vhm-cookie-consent';

    const acceptBtn = document.getElementById('cookie-accept');

    function hasChoice() {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch (e) {
        return null; // localStorage indisponível (ex.: modo privado bloqueado)
      }
    }

    function saveChoice(value) {
      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch (e) { /* ignora se não puder salvar */ }
    }

    function hideBanner() {
      banner.classList.remove('is-visible');
    }

    if (!hasChoice()) {
      // pequeno delay para não brigar com as animações de entrada da página
      setTimeout(() => banner.classList.add('is-visible'), 900);
    }

    acceptBtn?.addEventListener('click', () => {
      saveChoice('accepted');
      hideBanner();
    });
  })();

});