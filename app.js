(() => {
  const S = window.SITE || {};
  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const celular = matchMedia("(max-width: 760px)").matches;
  const fmt = (n) => n.toLocaleString("pt-BR");
  const numWa = String((S.whatsapp && S.whatsapp.numero) || "").replace(/\D/g, "");
  const waURL = (txt) => `https://wa.me/${numWa}?text=${encodeURIComponent(txt || (S.whatsapp && S.whatsapp.mensagem) || "")}`;

  /* ── Rolagem que toca o vídeo ─────────────────────────────────────────── */
  const cine = document.querySelector(".cine");
  const canvas = cine && cine.querySelector(".cine-canvas");
  if (cine && canvas && S.frames && S.frames.total) {
    const ctx = canvas.getContext("2d");
    const total = S.frames.total;
    const padrao = celular ? S.frames.mobile : S.frames.desktop;
    const src = (i) => padrao.replace("{n}", String(i + 1).padStart(4, "0"));
    const quadros = new Array(total);
    const momentos = [...cine.querySelectorAll(".momento")];
    let alvo = 0, atual = 0, desenhado = -1;

    const carregar = (i) => {
      if (quadros[i]) return quadros[i];
      const img = new Image();
      img.decoding = "async";
      img.src = src(i);
      img.onload = () => { if (Math.round(atual) === i || desenhado === -1) desenhar(i, true); };
      return (quadros[i] = img);
    };

    carregar(0);
    if (!reduzir) {
      const fila = [], visto = new Set();
      for (const passo of [8, 4, 2, 1]) for (let i = 0; i < total; i += passo) if (!visto.has(i)) { visto.add(i); fila.push(i); }
      let k = 0;
      const lote = () => { for (let n = 0; n < 6 && k < fila.length; n++) carregar(fila[k++]); if (k < fila.length) setTimeout(lote, 40); };
      lote();
    }

    const pronto = (i) => quadros[i] && quadros[i].complete && quadros[i].naturalWidth;
    const maisProximo = (i) => {
      for (let d = 0; d < total; d++) {
        if (pronto(i - d)) return i - d;
        if (pronto(i + d)) return i + d;
      }
      return -1;
    };

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      desenhado = -1;
      desenhar(Math.round(atual), true);
    };

    function desenhar(i, forcar) {
      const j = maisProximo(i);
      if (j < 0 || (j === desenhado && !forcar)) return;
      const img = quadros[j];
      const cw = canvas.width, ch = canvas.height;
      const escala = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * escala, h = img.naturalHeight * escala;
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
      desenhado = j;
    }

    const progresso = () => {
      const r = cine.getBoundingClientRect();
      const curso = cine.offsetHeight - innerHeight;
      return Math.min(1, Math.max(0, -r.top / (curso || 1)));
    };

    const atualizarMomentos = (p) => {
      for (const m of momentos) {
        const de = parseFloat(m.dataset.de || 0), ate = parseFloat(m.dataset.ate || 1);
        m.classList.toggle("ativo", p >= de && (p < ate || (ate >= 1 && p >= 1)));
      }
      cine.classList.toggle("andou", p > 0.02);
    };

    const quadro = () => {
      alvo = progresso() * (total - 1);
      atual += (alvo - atual) * 0.18;
      if (Math.abs(alvo - atual) < 0.05) atual = alvo;
      desenhar(Math.round(atual));
      atualizarMomentos(atual / (total - 1));
      requestAnimationFrame(quadro);
    };

    addEventListener("resize", ajustar);
    ajustar();
    if (reduzir) atualizarMomentos(0);
    else requestAnimationFrame(quadro);
  }

  /* ── Links de WhatsApp ────────────────────────────────────────────────── */
  document.querySelectorAll("[data-wa]").forEach((a) => {
    a.href = waURL();
    a.target = "_blank";
    a.rel = "noopener";
  });

  /* ── Planos (a partir de config.js) ───────────────────────────────────── */
  const grade = document.querySelector("[data-planos]");
  if (grade && S.planos) {
    const porDia = S.exibicoesPorDia || 720;
    grade.innerHTML = S.planos.map((p) => {
      const dia = p.paineis * porDia, mes = dia * 30;
      const un = p.paineis > 1 ? "painéis" : "painel";
      const msg = `Olá! Conheci a LEDS BAHIA e quero um orçamento do ${p.nome} (${p.paineis} ${un}).`;
      return `<article class="painel plano revelar${p.destaque ? " plano--destaque" : ""}">
        ${p.destaque ? '<span class="plano-selo">DESTAQUE</span>' : ""}
        <span class="rotulo">${p.nome}</span>
        <div class="plano-telas"><b>${p.paineis}</b><span>${un}</span></div>
        <div class="plano-icones" aria-hidden="true">${"<i></i>".repeat(p.paineis)}</div>
        <ul>
          <li>Exibições diárias <b>${fmt(dia)}</b></li>
          <li>Exibições estimadas em 30 dias <b>${fmt(mes)}</b></li>
        </ul>
        <div class="plano-preco" data-preco="${p.preco}" data-de="${p.contagemDe || p.preco * 2}"><small>R$</small><b aria-label="${fmt(p.preco)} reais">${fmt(reduzir ? p.preco : p.contagemDe || p.preco * 2)}</b><span>/mês</span></div>
        <a class="botao" href="${waURL(msg)}" target="_blank" rel="noopener">Solicitar orçamento</a>
      </article>`;
    }).join("");

    // Preços em contagem decrescente: começam altos e descem até o valor real ao entrar na tela
    const descer = (box) => {
      const b = box.querySelector("b"), fim = +box.dataset.preco, ini = +box.dataset.de, dur = 1300, t0 = performance.now();
      box.classList.add("contando");
      const passo = (agora) => {
        const k = Math.min(1, (agora - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        b.textContent = fmt(Math.round((ini + (fim - ini) * e) / 10) * 10);
        if (k < 1) return requestAnimationFrame(passo);
        b.textContent = fmt(fim);
        box.classList.remove("contando");
        box.classList.add("chegou");
      };
      requestAnimationFrame(passo);
    };
    const precos = [...grade.querySelectorAll(".plano-preco")];
    if (!reduzir && "IntersectionObserver" in window) {
      const ioPreco = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        ioPreco.unobserve(e.target);
        setTimeout(() => descer(e.target), 250 + precos.indexOf(e.target) * 160);
      }), { threshold: 0.6 });
      precos.forEach((el) => ioPreco.observe(el));
    } else precos.forEach((el) => (el.querySelector("b").textContent = fmt(+el.dataset.preco)));
  }

  /* ── Painéis de LED com anúncios de exemplo ───────────────────────────── */
  const ADS = {
    pizza: '<div class="ad ad--pizza"><span class="tag">PIZZARIA</span><div class="disc"></div><div class="big">Pizza<br>quentinha</div><div class="cta">Peça já</div><div class="yours">SUA MARCA AQUI</div></div>',
    mercado: '<div class="ad ad--mercado"><span class="tag">SUPERMERCADO</span><div class="pct">%</div><div class="big">Ofertas<br>da semana</div><div class="cta">Aproveite</div><div class="yours">SUA MARCA AQUI</div></div>',
    clinica: '<div class="ad ad--clinica"><span class="tag">CLÍNICA</span><div class="cross"></div><div class="big">Sua saúde<br>em primeiro<br>lugar</div><div class="cta">Agende sua consulta</div><div class="yours">SUA MARCA AQUI</div></div>',
    academia: '<div class="ad ad--academia"><span class="tag">ACADEMIA</span><div class="big">Treine<em>hoje.</em></div><div class="small">Seu melhor começa agora</div><div class="cta">Matricule-se</div><div class="yours">SUA MARCA AQUI</div></div>',
    servicos: '<div class="ad ad--servicos"><div class="raios"></div><span class="tag">LEDS BAHIA</span><div class="big">Sua<br>marca<br>aqui</div><div class="small">Quem é visto, é lembrado.</div><div class="cta">(73) 98142-5744</div></div>',
    static: '<div class="ad ad--static"><span class="tag">ARTE ESTÁTICA</span><div class="big">Sua<br>oferta<br><span>em<br>destaque</span></div><div class="cta">Sua marca aqui</div></div>',
    anim: '<div class="ad ad--anim"><i class="anel"></i><i class="anel"></i><i class="anel"></i><div class="big">Sua<br>marca<span>em<br>movimento</span></div><div class="letreiro">ARTE ANIMADA · SUA MARCA AQUI · ARTE ANIMADA ·</div></div>',
    video: '<div class="ad ad--video"><div class="filme"></div><span class="rec">VÍDEO · 15s</span><div class="big">Sua<br>história<br>em vídeo</div><div class="barra"></div><div class="small">SUA MARCA AQUI</div></div>',
  };
  const rotativos = [];
  document.querySelectorAll(".led[data-ads]").forEach((p) => {
    const lista = p.dataset.ads.split(",");
    p.setAttribute("aria-hidden", "true");
    p.innerHTML = '<div class="led-brilho"></div><div class="led-gabinete"><div class="led-tela">'
      + lista.map((k) => ADS[k] || ADS.servicos).join("")
      + '<div class="led-relogio"><span data-relogio>--:--</span><i>LEDS BAHIA</i></div>'
      + '<div class="led-malha"></div><div class="led-reflexo"></div></div></div><div class="led-poste"></div><div class="led-base"></div>';
    const ads = p.querySelectorAll(".ad");
    ads[0].classList.add("on");
    if (ads.length > 1) rotativos.push({ ads, i: 0, ms: +p.dataset.intervalo || 4500 });
  });
  if (!reduzir) rotativos.forEach((r) => setInterval(() => {
    r.ads[r.i].classList.remove("on"); r.i = (r.i + 1) % r.ads.length; r.ads[r.i].classList.add("on");
  }, r.ms));
  const relogio = () => {
    const d = new Date();
    const t = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    document.querySelectorAll("[data-relogio]").forEach((c) => (c.textContent = t));
  };
  relogio(); setInterval(relogio, 15000);

  /* ── Cena do totem: anúncios encaixados em perspectiva na tela azul ───── */
  // Mapeia o retângulo w×h do plano para os 4 cantos da tela (TL, TR, BR, BL) → matrix3d.
  const homografia = (w, h, [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]) => {
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den, hh = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3;
    return `matrix3d(${[a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1].map((n) => +n.toFixed(6)).join(",")})`;
  };
  document.querySelectorAll("[data-cena]").forEach((cena) => {
    const foto = cena.querySelector(".cena-foto");
    const plano = cena.querySelector(".cena-tela");
    const brilho = cena.querySelector(".cena-brilho");
    const tela = cena.querySelector("[data-ads-tela]");
    const cantos = cena.dataset.tela.trim().split(/\s+/).map((p) => p.split(",").map(Number));

    // Anúncios rodando (mesmos exemplos dos painéis da vitrine)
    const lista = tela.dataset.adsTela.split(",");
    tela.innerHTML = lista.map((k) => ADS[k] || ADS.servicos).join("")
      + '<div class="led-relogio"><span data-relogio>--:--</span><i>LEDS BAHIA</i></div><div class="led-malha"></div><div class="led-reflexo"></div>';
    const ads = tela.querySelectorAll(".ad");
    ads[0].classList.add("on");
    relogio();
    if (!reduzir && ads.length > 1) {
      let i = 0;
      setInterval(() => { ads[i].classList.remove("on"); i = (i + 1) % ads.length; ads[i].classList.add("on"); }, 3800);
    }

    // Encaixe: converte os cantos (frações da foto) para pixels, respeitando object-fit: cover
    const encaixar = () => {
      if (!foto.naturalWidth) return;
      const W = foto.clientWidth, H = foto.clientHeight;
      const s = Math.max(W / foto.naturalWidth, H / foto.naturalHeight);
      const dw = foto.naturalWidth * s, dh = foto.naturalHeight * s;
      // enquadra a foto para a tela ficar no meio da área visível
      const cx = (cantos[0][0] + cantos[2][0]) / 2, cy = (cantos[0][1] + cantos[2][1]) / 2;
      const px = dw > W ? Math.min(1, Math.max(0, (W / 2 - cx * dw) / (W - dw))) : 0.5;
      const py = dh > H ? Math.min(1, Math.max(0, (H * 0.5 - cy * dh) / (H - dh))) : 0.5;
      foto.style.objectPosition = `${(px * 100).toFixed(2)}% ${(py * 100).toFixed(2)}%`;
      const ox = (W - dw) * px, oy = (H - dh) * py;
      const pts = cantos.map(([x, y]) => [ox + x * dw, oy + y * dh]);
      plano.style.transform = homografia(plano.offsetWidth, plano.offsetHeight, pts);
      plano.classList.add("pronta");
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const l = Math.min(...xs), t = Math.min(...ys), r = Math.max(...xs), b = Math.max(...ys);
      const mx = (r - l) * 1.1, my = (b - t) * 0.45;
      Object.assign(brilho.style, { left: `${l - mx}px`, top: `${t - my}px`, width: `${r - l + mx * 2}px`, height: `${b - t + my * 2}px` });
    };
    if (foto.complete) encaixar();
    foto.addEventListener("load", encaixar);
    addEventListener("resize", encaixar);
    if ("ResizeObserver" in window) new ResizeObserver(encaixar).observe(foto);

    // Vídeo opcional: se existir assets/video/painel.mp4, ele toca no lugar dos anúncios
    const video = cena.querySelector(".cena-video");
    if (video && video.dataset.src && !reduzir) {
      const ioVideo = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) { if (video.src) video.pause(); return; }
        if (!video.src) {
          video.addEventListener("error", () => { video.remove(); ioVideo.disconnect(); }, { once: true });
          video.addEventListener("playing", () => video.classList.add("tocando"), { once: true });
          video.src = video.dataset.src;
        }
        video.play().catch(() => {});
      }, { rootMargin: "200px" });
      ioVideo.observe(cena);
    }
  });

  /* ── Vídeo da rua (seção 01): loop, pausa fora da tela para poupar bateria ─ */
  document.querySelectorAll(".arte-video").forEach((video) => {
    video.muted = true; // garante o autoplay no celular
    if (reduzir) { video.removeAttribute("autoplay"); video.pause(); return; }
    const tocar = () => video.play().catch(() => {});
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => (e.isIntersecting ? tocar() : video.pause()), { rootMargin: "200px" }).observe(video);
    } else tocar();
  });

  /* ── Parallax leve nas artes ──────────────────────────────────────────── */
  const artes = reduzir ? [] : [...document.querySelectorAll(".arte")];
  if (artes.length) {
    const mover = () => {
      for (const a of artes) {
        const r = a.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        a.style.transform = `translate3d(0, ${(c * -60).toFixed(1)}px, 0) scale(1.08)`;
      }
    };
    addEventListener("scroll", () => requestAnimationFrame(mover), { passive: true });
    mover();
  }

  /* ── Topo, botão flutuante, revelar, contadores e ano ─────────────────── */
  const topo = document.querySelector(".topo");
  const whats = document.querySelector(".whats");
  let formNaTela = false; // o botão flutuante se recolhe para não cobrir o "Enviar"
  const aoRolar = () => {
    topo && topo.classList.toggle("rolou", scrollY > 40);
    whats && whats.classList.toggle("visivel", scrollY > innerHeight * 0.6 && !formNaTela);
  };
  const formEl = document.querySelector(".form");
  if (formEl) new IntersectionObserver(([e]) => { formNaTela = e.isIntersecting; aoRolar(); }).observe(formEl);
  addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  const contar = (el) => {
    const fim = +el.dataset.conta, t0 = performance.now(), dur = 1600;
    const passo = (agora) => {
      const k = Math.min(1, (agora - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(Math.round(fim * e));
      if (k < 1) requestAnimationFrame(passo);
    };
    if (!reduzir) requestAnimationFrame(passo);
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("visto");
    e.target.querySelectorAll("[data-conta]").forEach(contar);
    io.unobserve(e.target);
  }), { threshold: 0.15 });
  document.querySelectorAll(".revelar").forEach((el) => io.observe(el));
  document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ── Formulário → e-mail + WhatsApp ───────────────────────────────────── */
  const form = document.querySelector(".form");
  if (form && S.contato) {
    const status = form.querySelector(".form-status");
    const botao = form.querySelector("button[type=submit]");
    const tel = form.elements.telefone;

    tel.addEventListener("input", () => {
      const d = tel.value.replace(/\D/g, "").slice(0, 11);
      if (d.length > 6) tel.value = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
      else if (d.length > 2) tel.value = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      else tel.value = d;
    });
    form.querySelectorAll("input, select").forEach((c) => c.addEventListener("input", () => c.closest(".campo")?.classList.remove("erro")));

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (form.elements._honey.value) return; // robô
      let valido = true;
      form.querySelectorAll("[required]").forEach((c) => {
        const ok = c === tel ? c.value.replace(/\D/g, "").length >= 10 : c.value.trim().length > 1;
        c.closest(".campo").classList.toggle("erro", !ok);
        if (!ok) valido = false;
      });
      if (!valido) {
        status.className = "form-status campo--inteiro falha";
        status.textContent = "Confira os campos destacados.";
        form.querySelector(".erro input, .erro select")?.focus();
        return;
      }

      const v = (n) => form.elements[n].value.trim();
      const dados = { nome: v("nome"), empresa: v("empresa"), telefone: v("telefone"), interesse: v("interesse") };
      const msg = `${S.whatsapp.mensagem}\n\n*Nome:* ${dados.nome}\n*Empresa:* ${dados.empresa}\n*Telefone:* ${dados.telefone}\n*Interesse:* ${dados.interesse}`;
      const url = waURL(msg);

      // 1) WhatsApp: abre na hora do clique (senão o navegador bloqueia a janela)
      try { window.open(url, "_blank", "noopener"); } catch (e) { /* segue com o link abaixo */ }
      status.className = "form-status campo--inteiro ok";
      status.innerHTML = `Tudo pronto! Sua mensagem foi preparada no WhatsApp.<br><a href="${url}" target="_blank" rel="noopener">Se não abriu, toque aqui para enviar →</a>`;

      // 2) E-mail: cópia do pedido para a equipe, em segundo plano
      const assunto = S.contato.assunto || `Novo contato pelo site ${S.nome || ""}`;
      let destino, corpo;
      if (S.contato.web3formsChave) {
        destino = "https://api.web3forms.com/submit";
        corpo = { access_key: S.contato.web3formsChave, subject: assunto, from_name: S.nome, ...dados };
      } else {
        destino = `https://formsubmit.co/ajax/${encodeURIComponent(S.contato.email)}`;
        corpo = { _subject: assunto, _template: "table", _captcha: "false", ...dados };
      }
      botao.disabled = true;
      fetch(destino, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(corpo),
      })
        .then((r) => r.json().catch(() => ({})).then((j) => { if (!r.ok || j.success === false || j.success === "false") throw new Error(j.message || r.status); }))
        .then(() => form.reset())
        .catch((e) => console.warn("Falha no envio do e-mail do formulário:", e))
        .finally(() => { botao.disabled = false; });
    });
  }
})();
