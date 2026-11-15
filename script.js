/* Currículo interativo — Thalissa Silva
   Jornada com avião, ferramentas, jogo Estaciona Aí, ranking e raio-X da partida. */

{
  /* ---------- utilidades ---------- */
  const $ = (s) => document.querySelector(s);
  const store = {
    get(k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    },
  };
  const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[rnd(0, a.length - 1)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (t) =>
    String(t).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const fmt = (n, d = 1) => n.toFixed(d).replace(".", ",");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ua = navigator.userAgent || "";
  const device = {
    ios:
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    android: /Android/i.test(ua),
    // dentro de outro app (Claude, Instagram, Facebook...) ou de um iframe
    inApp:
      window.self !== window.top ||
      /FBAN|FBAV|Instagram|Line\/|; wv\)|Claude/i.test(ua),
  };

  /* ---------- sons (gerados pelo navegador, sem arquivos) ---------- */
  const SND = { on: store.get("snd") !== "0", ctx: null };

  function audio() {
    try {
      if (!SND.ctx)
        SND.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (SND.ctx.state === "suspended") SND.ctx.resume();
      return SND.ctx;
    } catch (e) {
      return null;
    }
  }

  function tone(freq, dur, o = {}) {
    if (!SND.on) return;
    const ctx = audio();
    if (!ctx) return;
    const t = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide)
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, freq + o.slide),
        t + dur,
      );
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(o.vol || 0.18, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  const sfx = {
    click: () => tone(620, 0.04, { vol: 0.035 }),
    bell: (i) => {
      const f = [523, 587, 659, 784, 880][i % 5];
      tone(f, 0.5, { vol: 0.06 });
    },
    vroom: () => {
      tone(110, 0.5, { type: "sawtooth", vol: 0.05, slide: 220 });
      tone(220, 0.35, { type: "triangle", vol: 0.05, slide: 330, at: 0.05 });
    },
    honk: () => {
      tone(392, 0.12, { type: "square", vol: 0.06 });
      tone(392, 0.15, { type: "square", vol: 0.06, at: 0.17 });
    },
    ok: () => {
      tone(660, 0.1, { type: "triangle", vol: 0.15 });
      tone(990, 0.16, { type: "triangle", vol: 0.13, at: 0.08 });
    },
    win: () =>
      [523, 659, 784, 1047].forEach((f, i) =>
        tone(f, i === 3 ? 0.45 : 0.22, {
          type: "triangle",
          vol: 0.16,
          at: i * 0.11,
        }),
      ),
    lose: () =>
      [392, 370, 349, 294].forEach((f, i) =>
        tone(f, i === 3 ? 0.7 : 0.28, {
          type: "triangle",
          vol: 0.14,
          at: i * 0.25,
          slide: i === 3 ? -70 : 0,
        }),
      ),
    record: () => {
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        tone(f, 0.18, { type: "square", vol: 0.05, at: i * 0.08 }),
      );
      tone(1568, 0.7, { type: "triangle", vol: 0.14, at: 0.45 });
    },
  };

  document.addEventListener(
    "click",
    (e) => {
      if (e.target.closest(".btn, .chips button, .avs label, summary, .top a"))
        sfx.click();
    },
    true,
  );

  const sndBtn = $("#snd");
  function paintSound() {
    sndBtn.setAttribute("aria-pressed", SND.on);
    sndBtn.setAttribute("aria-label", SND.on ? "Desligar sons" : "Ligar sons");
    const waves = SND.on
      ? '<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
      : '<path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    sndBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>${waves}</svg>`;
  }
  sndBtn.onclick = () => {
    SND.on = !SND.on;
    store.set("snd", SND.on ? "1" : "0");
    paintSound();
    if (SND.on) sfx.ok();
  };
  paintSound();

  /* ---------- faixa de palavras ---------- */
  const words = [
    "Análise de Dados",
    "Business Intelligence",
    "Excel",
    "SQL",
    "Power BI",
    "Python",
    "KPIs",
    "Validação de dados",
    "Relatórios",
  ];
  $("#mq").innerHTML = [...words, ...words]
    .map((w) => `<span>${w}</span>`)
    .join("");

  /* ---------- ferramentas que guiam o trabalho ---------- */
  const skills = [
    [
      "Excel",
      "É onde o dado nasce na maioria das empresas.",
      "PROCV, PROCX, tabelas dinâmicas e planilhas de metas e projeções.",
    ],
    [
      "SQL",
      "Busca exatamente o dado certo, direto na base.",
      "Consultas e filtros para preparar as análises.",
    ],
    [
      "Power BI",
      "Transforma tabelas em decisão visual.",
      "Dashboard de vendas, lucro e margem com filtros (CECIERJ).",
    ],
    [
      "Python",
      "Automatiza e escala análises repetitivas.",
      "Agente com IA que responde perguntas sobre notas fiscais.",
    ],
    [
      "KPIs",
      "Mostram se o resultado está no caminho.",
      "Realizado x meta e quanto falta para chegar lá.",
    ],
    [
      "Validação",
      "Dado errado gera decisão errada.",
      "Conferência e consistência antes de qualquer relatório.",
    ],
  ];
  let skill = 0;
  function drawSkills() {
    $("#chips").innerHTML = skills
      .map(
        (s, i) =>
          `<button type="button" data-i="${i}" aria-pressed="${i === skill}">${s[0]}</button>`,
      )
      .join("");
    const s = skills[skill];
    $("#tool").innerHTML =
      `<p><b>Por que importa:</b> ${s[1]}</p><p class="how"><b>Como uso:</b> ${s[2]}</p>`;
  }
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    skill = +b.dataset.i;
    drawSkills();
  });
  drawSkills();

  /* ---------- ferramentas do dia a dia (passam sozinhas) ---------- */
  const tools = [
    ["Ex", "Excel", "Planilhas"],
    ["BI", "Power BI", "Dashboards"],
    ["SQL", "SQL", "Banco de dados"],
    ["Py", "Python", "Automação"],
    ["GH", "GitHub", "Versionamento"],
    ["IA", "Claude", "Inteligência artificial"],
  ];
  const toolInfo = {
    Excel: "PROCV, PROCX, tabelas dinâmicas e planilhas de metas e projeções.",
    "Power BI": "Dashboards de vendas, lucro e margem com filtros.",
    SQL: "Consultas para buscar e preparar exatamente os dados certos.",
    Python: "Automação e um agente com IA que analisa notas fiscais.",
    GitHub: "Versionamento e portfólio dos meus projetos.",
    Claude: "IA como apoio para análise, código e documentação.",
  };
  const toolCard = (t) =>
    `<button type="button" class="tool" data-t="${t[1]}"><i>${t[0]}</i><span><b>${t[1]}</b><small>${t[2]}</small></span></button>`;
  $("#track").innerHTML = [...tools, ...tools].map(toolCard).join("");
  $("#track").addEventListener("click", (e) => {
    const card = e.target.closest(".tool");
    if (!card) return;
    sfx.click();
    const name = card.dataset.t;
    document
      .querySelectorAll(".tool")
      .forEach((el) => el.classList.toggle("on", el.dataset.t === name));
    card.classList.remove("pop");
    void card.offsetWidth;
    card.classList.add("pop");
    $("#tooldesc").innerHTML = `<b>${name}:</b> ${toolInfo[name]}`;
  });

  /* ---------- jornada: carrossel com parque em movimento ---------- */
  const miles = [
    [
      "2022",
      "RealJF Soluções Financeiras",
      "Assistente Administrativo: conferência, validação e consolidação de dados, relatórios e indicadores.",
    ],
    [
      "2024",
      "Metas e projeções",
      "Planilhas próprias para acompanhar resultados e projetar o desempenho meu e da equipe.",
    ],
    [
      "2025",
      "Pós em BI, Big Data e IA",
      "Pós-graduação pela Universidade Focus, unindo análise de dados e inteligência artificial.",
    ],
    [
      "2025",
      "Oracle Next Education",
      "Formação em Data Science e IA pela Alura.",
    ],
    [
      "Agora",
      "Power BI e projetos com IA",
      "Curso de Power BI no CECIERJ e agente de análise de notas fiscais com Python.",
    ],
  ];
  const HC = ["#e07a9e", "#5a9fd6", "#d9a441", "#4fae8e", "#9d7fd6"];
  const shade = (hex, p) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (x) =>
      Math.round(x * (1 - p))
        .toString(16)
        .padStart(2, "0");
    return "#" + f(n >> 16) + f((n >> 8) & 255) + f(n & 255);
  };

  // brinquedo da jornada: chapéu mexicano em 3D (Three.js), com o vídeo como plano B
  const fair = $("#fair");
  const video = $("#ride");
  $("#years").innerHTML = miles
    .map(
      (m, i) => `<button type="button" data-i="${i}"><i></i>${m[0]}</button>`,
    )
    .join("");
  const yearBtns = [...document.querySelectorAll("#years button")];
  let current = -1;

  function showMile(i) {
    if (i === current) return;
    current = i;
    const m = miles[i];
    $("#jcard").innerHTML =
      `<div class="yr"><b style="color:${HC[i]}">${m[0]}</b><span>${i + 1}/${miles.length}</span></div><h3>${m[1]}</h3><p>${m[2]}</p>`;
    yearBtns.forEach((b, j) => b.setAttribute("aria-current", j === i));
  }
  showMile(0);

  const ride = { speed: 0, push: () => {}, focus: () => {} };

  function webglOk() {
    try {
      const c = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (c.getContext("webgl") || c.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  }

  let usingVideo = false;
  function fallback(err) {
    if (usingVideo) return;
    usingVideo = true;
    if (err) console.error(err);
    const c = fair.querySelector(".stage3d");
    if (c) c.remove();
    video.hidden = false;
    fair.classList.add("video-mode");
    useVideo();
  }

  if (window.THREE && webglOk()) {
    try {
      build3D();
    } catch (err) {
      fallback(err);
    }
  } else {
    fallback();
  }

  /* ----- versão 3D ----- */
  function build3D() {
    const T = window.THREE;
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.domElement.className = "stage3d";
    fair.prepend(renderer.domElement);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(35, 1, 0.1, 100);

    scene.add(new T.HemisphereLight(0xffffff, 0xe8d4e0, 0.75));
    const sun = new T.DirectionalLight(0xffffff, 0.55);
    sun.position.set(-5, 11, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0015;
    sun.shadow.normalBias = 0.03;
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    scene.add(sun);

    // material com acabamento polido (plástico brilhante, sem quinas)
    const clay = (color) =>
      new T.MeshPhysicalMaterial({
        color,
        roughness: 0.38,
        metalness: 0,
        clearcoat: 0.7,
        clearcoatRoughness: 0.25,
      });
    const CORAL = "#f4a6bf"; // rosa pastel
    const CREAM = "#fff8f0";
    const BLUE = "#a9d4f0";
    const GOLD = "#e8c27a";

    // caixa com todas as bordas arredondadas
    function roundedBox(w, h, d, r) {
      const s = new T.Shape();
      const x = -w / 2 + r;
      const y = -h / 2 + r;
      const iw = w - 2 * r;
      const ih = h - 2 * r;
      const c = Math.min(iw, ih) * 0.3;
      s.moveTo(x + c, y);
      s.lineTo(x + iw - c, y);
      s.quadraticCurveTo(x + iw, y, x + iw, y + c);
      s.lineTo(x + iw, y + ih - c);
      s.quadraticCurveTo(x + iw, y + ih, x + iw - c, y + ih);
      s.lineTo(x + c, y + ih);
      s.quadraticCurveTo(x, y + ih, x, y + ih - c);
      s.lineTo(x, y + c);
      s.quadraticCurveTo(x, y, x + c, y);
      const g = new T.ExtrudeGeometry(s, {
        depth: Math.max(0.001, d - 2 * r),
        bevelEnabled: true,
        bevelSize: r,
        bevelThickness: r,
        bevelSegments: 6,
        curveSegments: 12,
      });
      g.center();
      g.computeVertexNormals();
      return g;
    }

    // perfil girado (torno): base e toldo com curvas suaves
    const lathe = (pts, seg = 64) =>
      new T.LatheGeometry(
        pts.map(([x, y]) => new T.Vector2(x, y)),
        seg,
      );

    // chão invisível que só recebe a sombra (o fundo é a imagem do parque)
    const ground = new T.Mesh(
      new T.PlaneGeometry(30, 30),
      new T.ShadowMaterial({ opacity: 0.16 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // estrutura fixa: base arredondada e mastro
    const base = new T.Mesh(
      lathe([
        [0, 0.42],
        [1.55, 0.42],
        [1.72, 0.36],
        [1.8, 0.24],
        [1.95, 0.16],
        [2.25, 0.12],
        [2.32, 0.05],
        [2.28, 0],
        [0, 0],
      ]),
      clay(CORAL),
    );
    const baseRing = new T.Mesh(
      new T.TorusGeometry(2.2, 0.07, 16, 96),
      clay(BLUE),
    );
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.14;
    const pole = new T.Mesh(
      new T.CylinderGeometry(0.17, 0.21, 4.9, 48),
      clay(BLUE),
    );
    pole.position.y = 2.85;
    const collar1 = new T.Mesh(
      new T.TorusGeometry(0.22, 0.06, 16, 48),
      clay(GOLD),
    );
    collar1.rotation.x = Math.PI / 2;
    collar1.position.y = 0.5;
    const collar2 = collar1.clone();
    collar2.position.y = 2.6;
    [base, baseRing, pole, collar1, collar2].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = false;
      scene.add(m);
    });

    // parte que gira: toldo em cúpula, babado, anel e cadeirinhas
    const top = new T.Group();
    top.position.y = 5.2;
    scene.add(top);

    const stripes = document.createElement("canvas");
    stripes.width = 512;
    stripes.height = 8;
    const sx = stripes.getContext("2d");
    for (let i = 0; i < 16; i++) {
      sx.fillStyle = i % 2 ? CREAM : CORAL;
      sx.fillRect(i * 32, 0, 32, 8);
    }
    const stripeTex = new T.CanvasTexture(stripes);
    const domeMat = new T.MeshPhysicalMaterial({
      map: stripeTex,
      roughness: 0.4,
      clearcoat: 0.6,
      clearcoatRoughness: 0.3,
      side: T.DoubleSide,
    });
    const dome = new T.Mesh(
      lathe(
        [
          [2.72, 0],
          [2.6, 0.18],
          [2.25, 0.45],
          [1.7, 0.8],
          [1.1, 1.12],
          [0.55, 1.38],
          [0.18, 1.52],
          [0, 1.56],
        ],
        96,
      ),
      domeMat,
    );
    dome.castShadow = true;
    const rim = new T.Mesh(
      new T.TorusGeometry(2.66, 0.11, 20, 120),
      clay(CORAL),
    );
    rim.rotation.x = Math.PI / 2;
    const knob = new T.Mesh(new T.SphereGeometry(0.22, 32, 24), clay(GOLD));
    knob.position.y = 1.7;
    const neck = new T.Mesh(
      new T.CylinderGeometry(0.05, 0.08, 0.25, 16),
      clay(GOLD),
    );
    neck.position.y = 1.58;
    const ringM = new T.Mesh(
      new T.TorusGeometry(2.25, 0.07, 16, 96),
      clay(GOLD),
    );
    ringM.rotation.x = Math.PI / 2;
    ringM.position.y = -0.35;
    top.add(dome, rim, knob, neck, ringM);
    // babado: gotinhas arredondadas penduradas na borda
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const drop = new T.Mesh(
        new T.SphereGeometry(0.2, 24, 16),
        clay(i % 2 ? CREAM : CORAL),
      );
      drop.scale.set(1, 0.75, 0.6);
      drop.position.set(Math.cos(a) * 2.62, -0.16, Math.sin(a) * 2.62);
      drop.rotation.y = -a;
      top.add(drop);
    }

    function label(text, color) {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 104;
      const x = c.getContext("2d");
      const draw = () => {
        x.clearRect(0, 0, 256, 104);
        x.fillStyle = "#fffdf8";
        x.strokeStyle = color;
        x.lineWidth = 10;
        x.beginPath();
        x.roundRect ? x.roundRect(8, 8, 240, 88, 28) : x.rect(8, 8, 240, 88);
        x.fill();
        x.stroke();
        x.fillStyle = color;
        x.font = "800 52px Archivo, sans-serif";
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillText(text, 128, 56);
        tex.needsUpdate = true;
      };
      const tex = new T.CanvasTexture(c);
      draw();
      if (document.fonts) document.fonts.ready.then(draw);
      const sp = new T.Sprite(
        new T.SpriteMaterial({ map: tex, depthTest: false }),
      );
      sp.scale.set(1.05, 0.43, 1);
      sp.renderOrder = 5;
      return sp;
    }

    const SEATS = 10;
    const RING = 2.25;
    const CHAIN = 2.4;
    const seatColors = ["#f59bb5", "#8fc3ea", "#f7c873", "#9fd8c2", "#c9a7e8"];
    const chairs = [];
    const pickables = [];
    for (let k = 0; k < SEATS; k++) {
      const a = (k / SEATS) * Math.PI * 2;
      const mile = k % 2 === 0 ? k / 2 : -1;
      const color = mile >= 0 ? seatColors[mile] : seatColors[(k + 2) % 5];
      const holder = new T.Group();
      holder.position.set(Math.cos(a) * RING, -0.35, Math.sin(a) * RING);
      holder.rotation.y = -a;
      const swing = new T.Group();
      holder.add(swing);
      const chainMat = clay(GOLD);
      [-0.24, 0.24].forEach((z) => {
        const ch = new T.Mesh(
          new T.CylinderGeometry(0.02, 0.02, CHAIN, 10),
          chainMat,
        );
        ch.position.set(0, -CHAIN / 2, z);
        swing.add(ch);
      });
      const seatMat = clay(color);
      const seat = new T.Group();
      seat.position.y = -CHAIN - 0.05;
      const bottom = new T.Mesh(roundedBox(0.66, 0.16, 0.6, 0.07), seatMat);
      const back = new T.Mesh(roundedBox(0.14, 0.6, 0.6, 0.06), seatMat);
      back.position.set(-0.27, 0.25, 0);
      back.rotation.z = 0.12;
      const front = new T.Mesh(roundedBox(0.1, 0.24, 0.6, 0.045), seatMat);
      front.position.set(0.29, 0.08, 0);
      seat.add(bottom, back, front);
      seat.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.userData.mile = mile;
          pickables.push(o);
        }
      });
      swing.add(seat);
      if (mile >= 0) {
        const tag = label(miles[mile][0], shade(color, 0.35));
        tag.position.set(0, -CHAIN + 0.75, 0);
        tag.userData.mile = mile;
        swing.add(tag);
        pickables.push(tag);
      }
      top.add(holder);
      chairs.push({ swing, mile, a });
    }

    // movimento
    let omega = 0;
    let angle = 0;
    let target = null;
    let swingNow = 0;
    let swingVel = 0;
    let camX = 0;
    let camY = 0;
    let wantX = 0;
    let wantY = 0;
    const norm = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    ride.push = (amount = 1.1) => {
      target = null;
      omega = Math.min(4.2, omega + amount * 0.5);
    };
    ride.focus = (i) => {
      omega = 0;
      const a = (i * 2 * Math.PI * 2) / SEATS;
      target = angle + norm(a - Math.PI / 2 - angle);
    };

    function resize() {
      const w = fair.clientWidth;
      const h = fair.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(fair);
    resize();

    let last = performance.now();
    let visible = false;
    function frame(t) {
      if (usingVideo) return;
      try {
        step(t);
      } catch (err) {
        fallback(err);
        return;
      }
      if (visible) requestAnimationFrame(frame);
    }
    function step(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (target !== null) {
        const d = norm(target - angle);
        angle += d * Math.min(1, dt * 4);
        if (Math.abs(d) < 0.003) target = null;
      } else {
        angle += omega * dt;
      }
      omega *= Math.exp(-dt * 0.5);
      if (omega < 0.01) omega = 0;
      top.rotation.y = angle;

      // as cadeiras sobem com a velocidade, com um leve balanço (mola)
      const wanted = Math.min(1.0, omega * 0.32);
      swingVel += ((wanted - swingNow) * 9 - swingVel * 3.2) * dt;
      swingNow += swingVel * dt;
      chairs.forEach(
        (c, k) =>
          (c.swing.rotation.z = swingNow + Math.sin(t * 0.002 + k) * 0.015),
      );

      // câmera: aproxima no celular em pé e acompanha a inclinação/mouse
      camX += (wantX - camX) * Math.min(1, dt * 4);
      camY += (wantY - camY) * Math.min(1, dt * 4);
      const dist = Math.max(12.7, 15.2 / camera.aspect);
      const orbit = camX * 0.5;
      camera.position.set(
        Math.sin(orbit) * dist,
        3.6 + camY,
        Math.cos(orbit) * dist,
      );
      camera.lookAt(0, 3.1, 0);

      // cadeira com ano mais à frente
      let best = 0;
      let bestZ = -99;
      chairs.forEach((c) => {
        if (c.mile < 0) return;
        const z = Math.sin(c.a - angle);
        if (z > bestZ) {
          bestZ = z;
          best = c.mile;
        }
      });
      showMile(best);
      ride.speed = omega;
      $("#speedBar").style.width = `${Math.min(100, (omega / 4.2) * 100)}%`;

      renderer.render(scene, camera);
    }
    new IntersectionObserver((entries) => {
      const v = entries[0].isIntersecting;
      if (v && !visible) {
        visible = true;
        last = performance.now();
        requestAnimationFrame(frame);
      }
      visible = v;
    }).observe(fair);

    // toque: numa cadeira com ano, traz ela para frente; no resto, dá impulso
    const ray = new T.Raycaster();
    const pt = new T.Vector2();
    renderer.domElement.addEventListener("click", (e) => {
      const r = renderer.domElement.getBoundingClientRect();
      pt.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pt, camera);
      const hit = ray
        .intersectObjects(pickables, false)
        .find((h) => h.object.userData.mile >= 0);
      if (hit) {
        const i = hit.object.userData.mile;
        sfx.bell(i);
        ride.focus(i);
        showMile(i);
      } else {
        push();
      }
    });
    fair.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = fair.getBoundingClientRect();
      wantX = ((e.clientX - r.left) / r.width - 0.5) * 1.2;
      wantY = ((e.clientY - r.top) / r.height - 0.5) * -1.2;
    });
    fair.addEventListener("pointerleave", () => {
      wantX = 0;
      wantY = 0;
    });

    // sensores do celular: inclinar move a câmera, chacoalhar faz girar
    let lastShake = 0;
    function onTilt(e) {
      if (e.gamma == null) return;
      wantX = clamp(e.gamma / 45, -1, 1) * 0.45;
      wantY = clamp(((e.beta || 45) - 45) / 50, -1, 1) * 0.5;
    }
    function onShake(e) {
      const a = e.acceleration || {};
      const g = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
      const now = performance.now();
      if (g > 9 && now - lastShake > 180) {
        lastShake = now;
        push(Math.min(3, g / 6));
      }
    }
    step(performance.now());
    video.hidden = true;

    const sensorBtn = $("#sensors");
    const isTouch = matchMedia("(pointer: coarse)").matches;
    if ("DeviceMotionEvent" in window && isTouch) {
      sensorBtn.hidden = false;
      sensorBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        enableSensors();
      });
      $("#sheetRetry").addEventListener("click", () => {
        $("#sheet").hidden = true;
        enableSensors();
      });
    }

    let gotMotion = false;
    function onMotionData(e) {
      if (e.acceleration && e.acceleration.x != null) gotMotion = true;
      onShake(e);
    }

    // pede a permissão do próprio celular (no iPhone aparece a janela do sistema)
    async function enableSensors() {
      if (device.inApp) return sensorHelp("inapp");
      if (
        device.ios &&
        typeof DeviceMotionEvent.requestPermission === "function"
      ) {
        try {
          const ok = await DeviceMotionEvent.requestPermission();
          if (ok !== "granted") return sensorHelp("ios");
          if (typeof DeviceOrientationEvent.requestPermission === "function") {
            await DeviceOrientationEvent.requestPermission().catch(() => {});
          }
        } catch (err) {
          return sensorHelp("ios");
        }
      }
      // no Android o Chrome libera os sensores direto, sem perguntar
      window.addEventListener("devicemotion", onMotionData);
      window.addEventListener("deviceorientation", onTilt);
      sensorBtn.textContent = "Ligando sensores…";
      setTimeout(() => {
        if (gotMotion) {
          sensorBtn.textContent = "Sensores ativos: chacoalhe!";
          sensorBtn.disabled = true;
          $("#spinHint").textContent = "chacoalhe ou toque";
          $("#spinHint").style.opacity = 1;
        } else {
          sensorBtn.textContent = "Ativar sensores do celular";
          sensorHelp(device.ios ? "ios" : device.android ? "android" : "other");
        }
      }, 1200);
    }
  }

  function sensorHelp(kind) {
    const steps = {
      inapp: `<p>Você está abrindo o site dentro de um aplicativo, e ele bloqueia os sensores.</p>
        <ol><li>Toque no menu <b>⋮</b> ou <b>…</b> no canto da tela.</li><li>Escolha <b>Abrir no navegador</b> (${device.ios ? "Safari" : "Chrome"}).</li><li>Toque de novo em <b>Ativar sensores</b>.</li></ol>`,
      ios: `<p>O iPhone pergunta só uma vez. Se você tocou em <b>Não permitir</b>:</p>
        <ol><li>Feche esta aba do Safari.</li><li>Abra o site de novo.</li><li>Toque em <b>Ativar sensores</b> e depois em <b>Permitir</b>.</li></ol>`,
      android: `<p>Os sensores estão bloqueados neste site. Para liberar no Chrome:</p>
        <ol><li>Toque no ícone à esquerda do endereço do site.</li><li>Abra <b>Permissões</b> ou <b>Configurações do site</b>.</li><li>Em <b>Sensores de movimento</b>, escolha <b>Permitir</b>.</li><li>Volte e toque em <b>Tentar de novo</b>.</li></ol>`,
      other: `<p>Este navegador não liberou os sensores. Abra o site no <b>Chrome</b> (Android) ou no <b>Safari</b> (iPhone).</p>`,
    };
    $("#sheetBody").innerHTML = steps[kind] || steps.other;
    $("#sheetRetry").hidden = kind === "inapp";
    $("#sheet").hidden = false;
  }
  $("#sheetClose").addEventListener("click", () => ($("#sheet").hidden = true));

  /* ----- plano B: vídeo controlado pelos toques ----- */
  function useVideo() {
    let speed = 0;
    let lastTime = 0;
    let last = performance.now();
    let running = false;
    function tick(t) {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      speed *= Math.exp(-dt * 0.55);
      const rate = speed / 2.25;
      if (rate < 0.08) {
        speed = 0;
        video.pause();
      } else {
        video.playbackRate = clamp(rate, 0.1, 4);
        if (video.paused) video.play().catch(() => {});
      }
      if (video.currentTime + 0.5 < lastTime)
        showMile((current + 1) % miles.length);
      lastTime = video.currentTime;
      $("#speedBar").style.width = `${Math.min(100, (speed / 9) * 100)}%`;
      if (speed > 0) requestAnimationFrame(tick);
      else running = false;
    }
    ride.push = (amount = 1.1) => {
      speed = Math.min(9, speed + amount);
      video.play().catch(() => {});
      if (!running) {
        running = true;
        last = performance.now();
        requestAnimationFrame(tick);
      }
    };
    fair.addEventListener("click", () => push());
  }

  function push(amount) {
    ride.push(amount);
    tone(480, 0.07, { vol: 0.04, slide: 60 });
    $("#spinHint").style.opacity = 0;
  }

  $("#years").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const i = +b.dataset.i;
    sfx.bell(i);
    ride.focus(i);
    showMile(i);
  });

  /* ---------- personagens, frases e ranking ---------- */
  const FACE = (x, y, c = "#2c2f4a") =>
    `<circle cx="${x - 6}" cy="${y}" r="2.6" fill="${c}"/><circle cx="${x + 6}" cy="${y}" r="2.6" fill="${c}"/><path d="M${x - 5} ${y + 5}q5 5 10 0" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`;
  const AV = {
    planilha: [
      "Planilha",
      `<rect x="5" y="6" width="38" height="36" rx="7" fill="#22c55e" stroke="#2c2f4a" stroke-width="2.5"/><path d="M5 16h38M18 6v36M31 6v36" stroke="rgba(255,255,255,.55)" stroke-width="2"/>${FACE(24, 27)}`,
    ],
    grafico: [
      "Gráfico",
      `<rect x="6" y="24" width="10" height="18" rx="3" fill="#c4b5fd" stroke="#2c2f4a" stroke-width="2.5"/><rect x="32" y="16" width="10" height="26" rx="3" fill="#c4b5fd" stroke="#2c2f4a" stroke-width="2.5"/><rect x="15" y="6" width="18" height="36" rx="5" fill="#8b5cf6" stroke="#2c2f4a" stroke-width="2.5"/>${FACE(24, 20, "#fff")}`,
    ],
    banco: [
      "Banco",
      `<path d="M8 12v24c0 4 7 7 16 7s16-3 16-7V12" fill="#3b82f6" stroke="#2c2f4a" stroke-width="2.5"/><ellipse cx="24" cy="12" rx="16" ry="6" fill="#93c5fd" stroke="#2c2f4a" stroke-width="2.5"/>${FACE(24, 27, "#fff")}`,
    ],
    pizza: [
      "Pizza",
      `<circle cx="24" cy="24" r="18" fill="#ff8a00" stroke="#2c2f4a" stroke-width="2.5"/><path d="M24 24V6a18 18 0 0 1 17 12z" fill="#ffd500" stroke="#2c2f4a" stroke-width="2.5" stroke-linejoin="round"/>${FACE(21, 27)}`,
    ],
    robo: [
      "Robô",
      `<path d="M24 4v6" stroke="#2c2f4a" stroke-width="2.5"/><circle cx="24" cy="4" r="3" fill="#ff3b5c"/><rect x="7" y="10" width="34" height="30" rx="9" fill="#94a3b8" stroke="#2c2f4a" stroke-width="2.5"/><rect x="12" y="17" width="24" height="16" rx="6" fill="#e2e8f0"/>${FACE(24, 23)}`,
    ],
    lupa: [
      "Lupa",
      `<path d="M31 31l11 11" stroke="#2c2f4a" stroke-width="6" stroke-linecap="round"/><circle cx="21" cy="21" r="15" fill="#a5f3fc" stroke="#06b6d4" stroke-width="5"/>${FACE(21, 20)}`,
    ],
    carro: [
      "Carrinho",
      `<path d="M6 30q0-8 7-9l5-8h13l6 8q6 1 6 9v6H6z" fill="#ff3b5c" stroke="#2c2f4a" stroke-width="2.5" stroke-linejoin="round"/><circle cx="14" cy="37" r="5" fill="#2c2f4a"/><circle cx="35" cy="37" r="5" fill="#2c2f4a"/>${FACE(24, 27, "#fff")}`,
    ],
    nuvem: [
      "Nuvem",
      `<path d="M13 38a9 9 0 0 1-1-18 12 12 0 0 1 23-3 10 10 0 0 1 2 21z" fill="#7dd3fc" stroke="#2c2f4a" stroke-width="2.5" stroke-linejoin="round"/>${FACE(24, 28)}`,
    ],
  };
  const avSvg = (k) =>
    `<svg viewBox="0 0 48 48" aria-hidden="true">${(AV[k] || AV.planilha)[1]}</svg>`;
  const crown =
    '<svg class="crown" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="#f2b705" stroke="#b38600" stroke-width="1.5" stroke-linejoin="round"/></svg>';

  const PH = {
    pb: [
      "Novo recorde pessoal! Seu gráfico só sobe.",
      "Outlier positivo detectado: você superou a sua própria média!",
      "Seu KPI pessoal acabou de bater a meta.",
    ],
    owner: [
      "Você passou o recorde da Thalissa… e ela já atualizou a planilha. O 1º lugar continua dela!",
      "Recorde da dona batido! Mas ela rodou um UPDATE e voltou para o topo.",
      "Quase! A Thalissa viu seu número e subiu a meta. Tente de novo!",
    ],
    vice: [
      "2º lugar! Só a dona do estacionamento está na sua frente.",
      "Vice-líder! Seu nome subiu no ORDER BY, logo abaixo da Thalissa.",
    ],
    podio: [
      "Pódio! Os dados não mentem: você é fera.",
      "Top 3! Medalha garantida no relatório do mês.",
    ],
    lose: [
      "#N/D na vitória… mas todo analista revisa a fórmula e tenta de novo.",
      "Deu erro na consulta. Ajusta o WHERE e bora de novo!",
      "Até o melhor dashboard começou como uma planilha bagunçada.",
    ],
    ok: [
      "Dados registrados. Agora é buscar a tendência de alta!",
      "Média respeitável. Bora virar outlier?",
    ],
  };

  const OWNER = { n: "Thalissa", a: "grafico" };
  let ownerPts = +(store.get("owner_pts") || 1260);

  const getRank = () => {
    try {
      const a = JSON.parse(store.get("rank_park") || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  };

  function renderRank(me) {
    const list = getRank();
    const owner = `<li class="owner"><b>1</b>${avSvg(OWNER.a)}<span class="who"><span>${OWNER.n}${crown}</span><small>dona do estacionamento</small></span><em>${ownerPts}</em></li>`;
    const rows = list
      .slice(0, 10)
      .map(
        (r, i) =>
          `<li class="${r.t === me ? "me" : ""}"><b>${i + 2}</b>${avSvg(r.a)}<span class="who"><span>${esc(r.n)}</span><small>${r.avg ? fmt(r.avg, 2) + "s por decisão" : "fase " + (r.lv || 0)}</small></span><em>${r.s}</em></li>`,
      )
      .join("");
    $("#rk").innerHTML = owner + rows;
    const n = list.length + 1;
    $("#count").textContent =
      n + (n === 1 ? " participante" : " participantes");
  }

  // a dona do jogo sempre fica em 1º: se alguém passar, a pontuação dela sobe
  function guardOwner(score) {
    if (score < ownerPts) return false;
    ownerPts = score + rnd(12, 48);
    store.set("owner_pts", ownerPts);
    return true;
  }

  function rankForm() {
    const nick = store.get("nick") || "";
    const av = store.get("av") || "planilha";
    return `<form class="form" id="rf">
      <label>Seu nome ou apelido<input type="text" id="nick" maxlength="14" autocomplete="nickname" value="${esc(nick)}" placeholder="Ex.: Rainha do PROCX"></label>
      <fieldset class="avs"><legend>Escolha seu personagem</legend>${Object.keys(
        AV,
      )
        .map(
          (k) =>
            `<label><input type="radio" name="av" value="${k}" ${k === av ? "checked" : ""}>${avSvg(k)}${AV[k][0]}</label>`,
        )
        .join("")}</fieldset>
      <button class="btn" type="submit">Entrar no ranking ▸</button>
    </form>`;
  }

  function bindRank(run, again) {
    const f = $("#rf");
    if (!f) return;
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const n = $("#nick").value.trim().slice(0, 14);
      if (!n) {
        $("#nick").focus();
        $("#nick").placeholder = "Digite um apelido para entrar";
        return;
      }
      const a =
        (f.querySelector("input[name=av]:checked") || {}).value || "planilha";
      store.set("nick", n);
      store.set("av", a);
      const t = Date.now();
      const list = getRank();
      list.push({ n, a, s: run.score, t, avg: run.stats.avg, lv: run.lv });
      list.sort((x, y) => y.s - x.s || x.t - y.t);
      const pos = list.findIndex((r) => r.t === t) + 2;
      store.set("rank_park", JSON.stringify(list.slice(0, 30)));
      f.outerHTML = `<div class="stats"><div><b>${pos}º lugar</b><small>de ${list.length + 1} participantes</small></div><div><b>${run.score}</b><small>pontos</small></div></div><button class="btn" id="again" type="button">Jogar de novo ▸</button>`;
      const key = pos === 2 ? "vice" : pos <= 4 ? "podio" : null;
      if (key && !run.ownerBumped) $("#phrase").textContent = pick(PH[key]);
      key ? sfx.record() : sfx.ok();
      $("#again").onclick = again;
      renderRank(t);
      renderXray(run, n, a);
    });
  }

  /* ---------- raio-X da partida ---------- */
  const DIRS = ["direita", "esquerda", "cima", "baixo"];

  function analyze(run) {
    const log = run.log;
    const ok = log.filter((x) => x.ok);
    const avg = ok.length
      ? ok.reduce((s, x) => s + x.ms, 0) / ok.length / 1000
      : 0;
    const fastest = ok.length ? Math.min(...ok.map((x) => x.ms)) / 1000 : 0;
    const prec = log.length ? ok.length / log.length : 0;
    const dirs = DIRS.map((d) => {
      const all = log.filter((x) => x.dir === d);
      const hit = all.filter((x) => x.ok).length;
      return {
        d,
        total: all.length,
        hit,
        ratio: all.length ? hit / all.length : 0,
      };
    });
    const vans = log.filter((x) => x.van);
    const vanRatio = vans.length
      ? vans.filter((x) => x.ok).length / vans.length
      : 1;

    const pace = !avg
      ? "Sem dados"
      : avg < 1.2
        ? "Relâmpago"
        : avg < 2
          ? "Ágil"
          : avg < 3
            ? "Analítico"
            : "Cauteloso";
    const good = [];
    const bad = [];
    if (prec >= 0.85 && log.length >= 4)
      good.push("Precisão: quase não rodou etapas fora de ordem.");
    if (avg && avg < 1.6)
      good.push("Velocidade: decide rápido qual registro liberar.");
    const tried = dirs.filter((d) => d.total >= 2);
    const best = tried.slice().sort((a, b) => b.ratio - a.ratio)[0];
    const worst = tried.slice().sort((a, b) => a.ratio - b.ratio)[0];
    if (best && best.ratio >= 0.8)
      good.push(
        `Leitura de fluxo: acertou ${Math.round(best.ratio * 100)}% dos carros virados para ${best.d}.`,
      );
    if (run.lv >= 2) good.push(`Fôlego: liberou ${run.lv} fases seguidas.`);
    if (vans.length >= 2 && vanRatio >= 0.8)
      good.push("Registros grandes: liberou bem as vans.");

    if (prec < 0.7 && log.length >= 3)
      bad.push(
        "Ordem de execução: muitas batidas. Antes de tocar, confira se o caminho até a borda está livre.",
      );
    if (avg > 2.6)
      bad.push(
        "Tempo de decisão: hesitou bastante. Comece pelos carros que já estão de frente para a borda.",
      );
    if (worst && worst.ratio < 0.7 && worst !== best)
      bad.push(`Ponto cego: errou mais os carros virados para ${worst.d}.`);
    if (vans.length >= 2 && vanRatio < 0.6)
      bad.push("As vans (registros maiores) travaram você mais vezes.");

    if (!good.length)
      good.push("Persistência: encarou o engarrafamento até o fim.");
    if (!bad.length)
      bad.push(
        log.length < 6
          ? "Poucos dados ainda: jogue mais uma partida para um raio-X mais preciso."
          : "Nada grave! Agora é buscar mais velocidade.",
      );
    return {
      avg,
      fastest,
      prec,
      dirs,
      pace,
      good: good.slice(0, 3),
      bad: bad.slice(0, 3),
      exits: ok.length,
    };
  }

  function renderXray(run, nick, av) {
    const s = run.stats;
    const box = $("#xray");
    box.hidden = false;
    const eye =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5.5 12s2.5-4 6.5-4 6.5 4 6.5 4-2.5 4-6.5 4-6.5-4-6.5-4z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>';
    box.innerHTML = `<h3>${eye}Raio-X da partida</h3>
      <p class="who">${nick ? "O olhar de " + esc(nick) : "Como você jogou"}</p>
      <div class="stats">
        <div><b>${s.avg ? fmt(s.avg, 2) + "s" : "–"}</b><small>Decisão média</small></div>
        <div><b>${Math.round(s.prec * 100)}%</b><small>Precisão</small></div>
        <div><b>${s.exits}</b><small>Registros processados</small></div>
        <div><b>${s.fastest ? fmt(s.fastest, 2) + "s" : "–"}</b><small>Decisão mais rápida</small></div>
      </div>
      <div class="pace"><b>Ritmo: ${s.pace}</b>
        <div class="bar"><i style="left:${s.avg ? clamp((s.avg / 4) * 100, 2, 98) : 50}%"></i></div>
        <div class="ends"><span>Relâmpago</span><span>Ágil</span><span>Analítico</span><span>Cauteloso</span></div>
      </div>
      <div class="sw">
        <div class="good"><h4>Pontos fortes</h4><ul>${s.good.map((t) => `<li>${t}</li>`).join("")}</ul></div>
        <div class="bad"><h4>Pontos de atenção</h4><ul>${s.bad.map((t) => `<li>${t}</li>`).join("")}</ul></div>
      </div>
      <div class="dirs"><b>Acerto por direção do carro</b>${s.dirs
        .map(
          (d) =>
            `<div class="drow"><small>${d.d}</small><span><i style="width:${Math.round(d.ratio * 100)}%"></i></span><em>${d.total ? Math.round(d.ratio * 100) + "%" : "–"}</em></div>`,
        )
        .join("")}</div>`;
  }

  /* ---------- jogo Estaciona Aí ---------- */
  const N = 6,
    JC = [
      "#f59bb5",
      "#8fc3ea",
      "#f7c873",
      "#9fd8c2",
      "#c9a7e8",
      "#ffb38a",
      "#a7b8f5",
      "#f7a8d0",
      "#b5e3e8",
      "#c8e6a0",
    ];
  function carSvg(c) {
    const L = c.L,
      W = L * 50,
      col = c.col,
      glass = "#4a4f7a";
    const wh = (x, y) =>
      `<rect x="${x}" y="${y}" width="14" height="7" rx="3" fill="#3a3d5c"/>`;
    let g = wh(12, 1) + wh(12, 42) + wh(W - 26, 1) + wh(W - 26, 42);
    if (L === 3) g += wh(W / 2 - 7, 1) + wh(W / 2 - 7, 42);
    g += `<rect x="3" y="8" width="${W - 6}" height="40" rx="14" fill="rgba(0,0,0,.28)"/>
 <rect x="3" y="4" width="${W - 6}" height="41" rx="14" fill="${col}"/>
 <rect x="3" y="30" width="${W - 6}" height="15" rx="12" fill="rgba(0,0,0,.14)"/>
 <rect x="6" y="6" width="${W - 12}" height="8" rx="4" fill="rgba(255,255,255,.28)"/>
 <rect x="12" y="9" width="${W - (L === 3 ? 28 : 38)}" height="31" rx="9" fill="${glass}"/>
 <rect x="20" y="11" width="${W - (L === 3 ? 44 : 58)}" height="27" rx="7" fill="${col}"/>
 <rect x="20" y="11" width="${W - (L === 3 ? 44 : 58)}" height="27" rx="7" fill="rgba(255,255,255,.22)"/>
 <path d="M${W - (L === 3 ? 22 : 24)} 13l4 0-3 8z" fill="rgba(255,255,255,.55)"/>
 <rect x="${W - 8}" y="8" width="4" height="8" rx="2" fill="#fff7c2"/><rect x="${W - 8}" y="33" width="4" height="8" rx="2" fill="#fff7c2"/>
 <rect x="4" y="9" width="3" height="7" rx="1.5" fill="#ff3030"/><rect x="4" y="33" width="3" height="7" rx="1.5" fill="#ff3030"/>`;
    if (L === 3) {
      let r = "";
      for (let x = 28; x < W - 36; x += 11)
        r += `<rect x="${x}" y="13" width="3" height="23" rx="1.5" fill="rgba(255,255,255,.75)"/>`;
      g +=
        r +
        `<rect x="24" y="14" width="${W - 64}" height="3" rx="1.5" fill="rgba(255,255,255,.75)"/><rect x="24" y="32" width="${W - 64}" height="3" rx="1.5" fill="rgba(255,255,255,.75)"/>`;
    }
    const vb = c.h ? `0 0 ${W} 50` : `0 0 50 ${W}`;
    const tr = c.h
      ? c.d > 0
        ? ""
        : `translate(${W},50) rotate(180)`
      : c.d > 0
        ? `translate(50,0) rotate(90)`
        : `translate(0,${W}) rotate(-90)`;
    return `<svg viewBox="${vb}" aria-hidden="true"><g transform="${tr}">${g}</g></svg>`;
  }
  const cellsOf = (c) =>
    Array.from({ length: c.L }, (_, i) =>
      c.h ? [c.x + i, c.y] : [c.x, c.y + i],
    );
  function probe(c, cars) {
    const occ = new Map();
    cars.forEach((o) => {
      if (o !== c) cellsOf(o).forEach(([x, y]) => occ.set(x + "," + y, o));
    });
    const cs = cellsOf(c);
    let [x, y] = c.d > 0 ? cs[cs.length - 1] : cs[0];
    const dx = c.h ? c.d : 0,
      dy = c.h ? 0 : c.d;
    let n = 0;
    while (true) {
      x += dx;
      y += dy;
      if (x < 0 || y < 0 || x >= N || y >= N) return { clear: true, n };
      const o = occ.get(x + "," + y);
      if (o) return { clear: false, n, by: o };
      n++;
    }
  }
  function solvable(cars) {
    let a = cars.slice(),
      go = true;
    while (a.length && go) {
      go = false;
      for (const c of a)
        if (probe(c, a).clear) {
          a = a.filter((o) => o !== c);
          go = true;
          break;
        }
    }
    return !a.length;
  }
  function genLevel(n) {
    let best = null;
    for (let t = 0; t < 300; t++) {
      const cars = [],
        occ = new Set();
      for (let k = 0; k < n * 10 && cars.length < n; k++) {
        const h = Math.random() < 0.3,
          L = Math.random() < (h ? 0.35 : 0.08) ? 3 : 2,
          x = rnd(0, h ? N - L : N - 1),
          y = h ? rnd(0, N - 1) : L === 2 ? pick([0, 2, 4]) : rnd(0, N - L);
        const c = {
          L,
          h,
          x,
          y,
          d: Math.random() < 0.5 ? 1 : -1,
          col: pick(JC),
        };
        if (cellsOf(c).some(([a, b]) => occ.has(a + "," + b))) continue;
        cellsOf(c).forEach(([a, b]) => occ.add(a + "," + b));
        cars.push(c);
      }
      if (cars.length < n - 1 || !solvable(cars)) continue;
      const free = cars.filter((c) => probe(c, cars).clear).length;
      if (cars.length >= n - 1 && free <= 2) return cars;
      if (!best || free < best.f) best = { cars, f: free };
    }
    return best ? best.cars : genLevel(n - 1);
  }
  const CNAME = {
    "#f59bb5": "rosa",
    "#8fc3ea": "azul",
    "#f7c873": "amarelo",
    "#9fd8c2": "verde-menta",
    "#c9a7e8": "lilás",
    "#ffb38a": "pêssego",
    "#a7b8f5": "azul-lavanda",
    "#f7a8d0": "rosa-chiclete",
    "#b5e3e8": "azul-água",
    "#c8e6a0": "verde-limão",
  };
  const blocker = (c) =>
    (c.L === 3 ? "da van " : "do carro ") + (CNAME[c.col] || "");
  const dirOf = (c) =>
    c.h ? (c.d > 0 ? "direita" : "esquerda") : c.d > 0 ? "baixo" : "cima";

  let J = null;
  let RUN = null;
  let best = +(store.get("jam_pts") || 0);
  const heart = (on) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z" fill="${on ? "#e07a9e" : "none"}" stroke="${on ? "#e07a9e" : "#cfc9de"}" stroke-width="2"/></svg>`;
  const hearts = () => [0, 1, 2].map((i) => heart(i < RUN.lives)).join("");
  const setRecord = () => ($("#rec").textContent = "Recorde: " + best);

  function intro() {
    setRecord();
    const demo = [
      { L: 2, h: true, d: 1, col: "#f59bb5" },
      { L: 2, h: true, d: 1, col: "#f7c873" },
      { L: 3, h: true, d: 1, col: "#8fc3ea" },
      { L: 2, h: true, d: 1, col: "#9fd8c2" },
    ];
    $("#stage").innerHTML = `<div class="screen">
      <div class="cars">${demo.map((c) => `<span style="width:${c.L * 30}px">${carSvg(c)}</span>`).join("")}</div>
      <p class="title">ESTACIONA AÍ</p>
      <p>Cada carro é um registro de uma base de dados travada. Libere todos, na ordem certa, até a SAÍDA: o relatório final. Bateu? Erro de dependência, e você perde uma vida.</p>
      <button class="btn yellow" id="go" type="button">Jogar ▸</button>
      <span class="coin">INSERT COIN</span>
    </div>`;
    $("#go").onclick = newRun;
  }

  function newRun() {
    RUN = { score: 0, lives: 3, lv: 0, log: [], last: performance.now() };
    startLevel(1);
  }

  function startLevel(lv) {
    J = { lv, cars: genLevel(Math.min(9 + lv, 15)), bumps: 0, busy: new Set() };
    J.total = J.cars.length;
    RUN.last = performance.now();
    $("#stage").innerHTML = `<div class="hud">
        <div><small>Fase</small><strong>${lv}</strong></div>
        <div><small>Pontos</small><strong id="pts">${RUN.score}</strong></div>
        <div><small>Vidas</small><strong class="lives" id="lives">${hearts()}</strong></div>
      </div>
      <div class="frame"><div class="exitroad"></div><span class="exitsign">SAÍDA ↑</span>
        <div class="yard" id="yard"><svg class="arrows" id="arrows" aria-hidden="true"></svg><div class="lot" id="lot"></div></div>
      </div>
      <div class="msg" id="msg" aria-live="polite">Libere os registros (carros) na ordem certa até a SAÍDA.</div>`;
    const lot = $("#lot");
    J.cars.forEach((c, i) => {
      const e = document.createElement("button");
      e.type = "button";
      e.className = "car";
      e.setAttribute("aria-label", "Carro " + (i + 1));
      e.style.cssText = `left:${(c.x / N) * 100}%;top:${(c.y / N) * 100}%;width:${((c.h ? c.L : 1) / N) * 100}%;height:${((c.h ? 1 : c.L) / N) * 100}%`;
      e.innerHTML = carSvg(c);
      c.el = e;
      e.onclick = () => tapCar(c);
      lot.appendChild(e);
    });
    drawArrows();
  }

  function drawArrows() {
    const y = $("#yard"),
      W = y.clientWidth,
      r = W * 0.11,
      m = r / 2,
      sv = $("#arrows");
    const ch = (x, yy, a) =>
      `<path d="M-7 -6 L3 0 L-7 6" transform="translate(${x} ${yy}) rotate(${a})" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    sv.setAttribute("viewBox", `0 0 ${W} ${W}`);
    sv.innerHTML = [
      ch(W * 0.3, m, 0),
      ch(W * 0.7, m, 0),
      ch(W - m, W * 0.35, -90),
      ch(W - m, W * 0.7, -90),
      ch(m, W * 0.65, -90),
      ch(m, W * 0.3, -90),
      ch(W * 0.35, W - m, 0),
      ch(W * 0.7, W - m, 0),
    ].join("");
  }
  function exitPath(c, r) {
    const lot = $("#lot"),
      S = lot.clientWidth,
      cell = S / N,
      R = lot.offsetLeft,
      m = R / 2;
    const cx = (c.x + (c.h ? c.L : 1) / 2) * cell,
      cy = (c.y + (c.h ? 1 : c.L) / 2) * cell;
    const dx = c.h ? c.d : 0,
      dy = c.h ? 0 : c.d,
      TR = [S + m, -m],
      out = [S + m, -R - 60];
    let pts;
    if (dx > 0) pts = [[S + m, cy], TR, out];
    else if (dy < 0) pts = [[cx, -m], TR, out];
    else if (dx < 0) pts = [[-m, cy], [-m, -m], TR, out];
    else pts = [[cx, S + m], [S + m, S + m], TR, out];
    const ang = (p, q) =>
      (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
    const a0 = c.h ? (c.d > 0 ? 0 : 180) : c.d > 0 ? 90 : -90;
    let prev = [cx, cy],
      rot = 0,
      heading = a0,
      len = 0;
    const segs = [];
    pts.forEach((p) => {
      const l = Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      if (l < 1) {
        prev = p;
        return;
      }
      const a = ang(prev, p);
      let d = a - heading;
      d = ((d + 540) % 360) - 180;
      rot += d;
      heading = a;
      segs.push({ p, rot, l });
      len += l;
      prev = p;
    });
    let acc = 0;
    const kf = [{ transform: "translate(0px,0px) rotate(0deg)", offset: 0 }];
    let lastRot = 0;
    segs.forEach((s, i) => {
      const t0 = acc / len;
      if (i > 0 && s.rot !== lastRot)
        kf.push({
          transform: `translate(${(segs[i - 1].p[0] - cx).toFixed(1)}px,${(segs[i - 1].p[1] - cy).toFixed(1)}px) rotate(${s.rot}deg)`,
          offset: Math.min(0.999, t0 + 0.02),
        });
      acc += s.l;
      kf.push({
        transform: `translate(${(s.p[0] - cx).toFixed(1)}px,${(s.p[1] - cy).toFixed(1)}px) rotate(${s.rot}deg)`,
        offset: Math.min(1, acc / len),
      });
      lastRot = s.rot;
    });
    kf[kf.length - 1].offset = 1;
    return { kf, len };
  }
  function tapCar(c) {
    if (!J || J.busy.has(c) || J.over) return;
    const now = performance.now();
    const ms = now - RUN.last;
    RUN.last = now;
    const r = probe(c, J.cars);
    const cell = $("#lot").clientWidth / N;
    const dx = c.h ? c.d : 0;
    const dy = c.h ? 0 : c.d;
    RUN.log.push({ ms, ok: r.clear, dir: dirOf(c), van: c.L === 3 });

    if (r.clear) {
      J.busy.add(c);
      J.cars = J.cars.filter((o) => o !== c);
      RUN.score += 10 + (ms < 1500 ? 5 : 0);
      $("#pts").textContent = RUN.score;
      const path = exitPath(c, r);
      c.el.style.zIndex = 6;
      c.el.animate(path.kf, {
        duration: Math.max(700, path.len * 1.6),
        easing: "ease-in",
        fill: "forwards",
      }).onfinish = () => {
        c.el.remove();
        if (!J.cars.length) winLevel();
      };
      sfx.vroom();
      $("#msg").textContent =
        `Registro ${J.total - J.cars.length} de ${J.total} processado ✓`;
      return;
    }

    J.bumps++;
    RUN.lives--;
    $("#lives").innerHTML = hearts();
    J.busy.add(c);
    if (RUN.lives <= 0) {
      J.over = true;
      setTimeout(() => endRun(true), 700);
    }
    const go = r.n * cell + cell * 0.18;
    c.el.animate(
      [
        { transform: "translate(0,0)" },
        { transform: `translate(${dx * go}px,${dy * go}px)`, offset: 0.5 },
        { transform: "translate(0,0)" },
      ],
      { duration: 300 + r.n * 60, easing: "ease-in-out" },
    ).onfinish = () => J && J.busy.delete(c);
    setTimeout(
      () =>
        r.by.el.animate(
          [
            { transform: "rotate(0)" },
            { transform: "rotate(-4deg)" },
            { transform: "rotate(4deg)" },
            { transform: "rotate(0)" },
          ],
          { duration: 260 },
        ),
      150 + r.n * 30,
    );
    sfx.honk();
    $("#msg").textContent =
      RUN.lives > 0
        ? `Erro de dependência! Esse registro depende ${blocker(r.by)} sair antes.`
        : "Fluxo travado! Erros demais na ordem de execução.";
  }

  function winLevel() {
    if (!J) return;
    const stars = J.bumps === 0 ? 3 : J.bumps <= 1 ? 2 : 1;
    const lv = J.lv;
    const bonus = 50 + stars * 20;
    RUN.score += bonus;
    RUN.lv = lv;
    J = null;
    sfx.win();
    $("#stage").innerHTML = `<div class="screen">
      <p class="title" style="color:#e8a93a;letter-spacing:6px">${"★".repeat(stars)}<span style="opacity:.3">${"★".repeat(3 - stars)}</span></p>
      <p class="title">Fase ${lv} liberada!</p>
      <p>Fluxo concluído: todos os registros chegaram ao relatório na ordem certa. +${bonus} pontos (total ${RUN.score}).</p>
      <div class="cta"><button class="btn yellow" id="next" type="button">Próxima fase ▸</button><button class="btn ghost" id="stop" type="button" >Parar e ver meu raio-X</button></div>
    </div>`;
    $("#next").onclick = () => startLevel(lv + 1);
    $("#stop").onclick = () => endRun(false);
  }

  function endRun(lost) {
    if (!RUN) return;
    const run = RUN;
    RUN = null;
    J = null;
    run.stats = analyze(run);
    const isBest = run.score > best && run.score > 0;
    if (isBest) {
      best = run.score;
      store.set("jam_pts", best);
    }
    run.ownerBumped = guardOwner(run.score);
    setRecord();
    const key = run.ownerBumped
      ? "owner"
      : isBest
        ? "pb"
        : lost
          ? "lose"
          : "ok";
    setTimeout(
      () => (isBest ? sfx.record() : lost ? sfx.lose() : sfx.ok()),
      150,
    );
    $("#stage").innerHTML = `<div class="result">
      <div class="score ${lost ? "lost" : ""}"><small>${lost ? "O fluxo de dados travou!" : "Partida encerrada"}</small><b>${run.score} pontos</b><small>${run.lv ? "Fases liberadas: " + run.lv : "Nenhuma fase liberada"}</small></div>
      <p class="phrase" id="phrase">${pick(PH[key])}</p>
      ${rankForm()}
    </div>`;
    bindRank(run, newRun);
    renderRank();
    renderXray(run, "", "");
    $("#stage").scrollIntoView({
      behavior: still ? "auto" : "smooth",
      block: "start",
    });
  }

  renderRank();
  intro();
}
