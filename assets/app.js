/* ============================================================
   ÇA PARLE — app.js
   ============================================================ */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     LIQUID METAL FACTORY
     SVG chromé : reflets en bandes qui tournent (effet sphère)
     + distorsion organique (feTurbulence/feDisplacementMap)
     + specular hotspot piloté par le curseur.
     Les couleurs viennent des tokens CSS (var(--lm-*)) → retint
     automatiquement au swap de marque.
  --------------------------------------------------------- */
  let UID = 0;
  function makeMetal(opts) {
    opts = opts || {};
    const id = "lm" + (UID++);
    const blob = !!opts.blob;
    const dur = opts.dur || 26;
    const wobble = opts.wobble || 26;
    // forme : cercle (sphère) ou blob organique
    const shape = blob
      ? `<path class="lmShape" d="M250,40 C360,40 470,120 470,250 C470,380 380,470 250,470 C120,470 30,370 30,240 C30,120 140,40 250,40 Z"/>`
      : `<circle class="lmShape" cx="250" cy="250" r="220"/>`;

    return `
<svg class="lm" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="${id}-ball" cx="38%" cy="32%" r="75%">
      <stop offset="0%"  stop-color="var(--lm-3)"/>
      <stop offset="32%" stop-color="var(--lm-2)"/>
      <stop offset="60%" stop-color="var(--lm-1)"/>
      <stop offset="100%" stop-color="var(--lm-0)"/>
    </radialGradient>
    <linearGradient id="${id}-env" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="var(--lm-0)"/>
      <stop offset="22%" stop-color="var(--lm-2)"/>
      <stop offset="44%" stop-color="var(--lm-3)"/>
      <stop offset="52%" stop-color="var(--lm-4)"/>
      <stop offset="70%" stop-color="var(--lm-1)"/>
      <stop offset="100%" stop-color="var(--lm-0)"/>
    </linearGradient>
    <radialGradient id="${id}-hot" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="40%" stop-color="var(--lm-3)" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${id}-rim" cx="50%" cy="50%" r="50%">
      <stop offset="54%" stop-color="var(--lm-0)" stop-opacity="0"/>
      <stop offset="86%" stop-color="var(--lm-0)" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="var(--lm-0)" stop-opacity="0.95"/>
    </radialGradient>
    <filter id="${id}-liquid" x="-25%" y="-25%" width="150%" height="150%">
      <feTurbulence type="fractalNoise" baseFrequency="0.009 0.013" numOctaves="2" seed="${(Math.random()*90)|0}" result="n">
        <animate attributeName="baseFrequency" dur="${dur}s" values="0.009 0.013;0.016 0.008;0.007 0.015;0.009 0.013" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${wobble}" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <clipPath id="${id}-clip">${shape}</clipPath>
  </defs>

  <g filter="url(#${id}-liquid)">
    <!-- base sphère -->
    ${shape.replace('class="lmShape"', `fill="url(#${id}-ball)"`)}
    <!-- reflets d'environnement qui tournent -->
    <g clip-path="url(#${id}-clip)">
      <g style="mix-blend-mode:overlay" opacity="0.9">
        <rect x="-180" y="-180" width="860" height="860" fill="url(#${id}-env)">
          <animateTransform attributeName="transform" type="rotate" from="0 250 250" to="360 250 250" dur="${dur*1.6}s" repeatCount="indefinite"/>
        </rect>
      </g>
      <rect x="-180" y="-180" width="860" height="860" fill="url(#${id}-env)" opacity="0.35">
        <animateTransform attributeName="transform" type="rotate" from="360 250 250" to="0 250 250" dur="${dur*2.4}s" repeatCount="indefinite"/>
      </rect>
      <!-- hotspot specular (curseur) -->
      <circle class="lmHot" cx="200" cy="170" r="150" fill="url(#${id}-hot)"/>
      <!-- assombrissement des bords -->
      ${shape.replace('class="lmShape"', `fill="url(#${id}-rim)"`)}
    </g>
  </g>
</svg>`;
  }

  function mountMetals() {
    document.querySelectorAll("[data-metal]").forEach((el) => {
      const blob = el.hasAttribute("data-blob");
      el.innerHTML = makeMetal({
        blob,
        dur: parseFloat(el.getAttribute("data-dur")) || (blob ? 30 : 22),
        wobble: parseFloat(el.getAttribute("data-wobble")) || (blob ? 12 : 6),
      });
    });
  }

  /* ---------------------------------------------------------
     CURSEUR CHROMÉ + hotspot hero qui suit la souris
  --------------------------------------------------------- */
  function initCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const ring = document.querySelector(".cursor");
    const dot = document.querySelector(".cursor-dot");
    if (!ring) return;
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      requestAnimationFrame(loop);
    })();
    const hot = (e) => { const t = e.target.closest("a,button,input,select,textarea,[data-hover]"); ring.classList.toggle("is-hover", !!t); };
    addEventListener("mouseover", hot);

    // hotspot specular du hero qui suit la souris
    const heroSvg = document.querySelector(".hero-sphere.main");
    if (heroSvg) {
      addEventListener("mousemove", (e) => {
        const hots = heroSvg.querySelectorAll(".lmHot");
        const r = heroSvg.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 500;
        const y = ((e.clientY - r.top) / r.height) * 500;
        hots.forEach((h) => {
          h.setAttribute("cx", Math.max(60, Math.min(440, x)));
          h.setAttribute("cy", Math.max(60, Math.min(440, y)));
        });
      });
    }
  }

  /* ---------------------------------------------------------
     NAV
  --------------------------------------------------------- */
  function initNav() {
    const nav = document.querySelector(".nav");
    const links = document.querySelector(".nav-links");
    const burger = document.querySelector(".burger");
    addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 40), { passive: true });
    burger.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      burger.classList.toggle("x", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => { links.classList.remove("open"); burger.classList.remove("x"); document.body.style.overflow = ""; })
    );
  }

  /* ---------------------------------------------------------
     REVEAL au scroll
  --------------------------------------------------------- */
  function initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target;
          if (el.hasAttribute("data-stagger")) {
            [...el.children].forEach((c, i) => (c.style.transitionDelay = i * 0.07 + "s"));
          }
          el.classList.add("in");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal,[data-stagger]").forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------
     PARALLAX léger (sphères / floats)
  --------------------------------------------------------- */
  function initParallax() {
    const items = [...document.querySelectorAll("[data-par]")];
    let ticking = false;
    function upd() {
      const vh = innerHeight;
      items.forEach((el) => {
        const speed = parseFloat(el.getAttribute("data-par"));
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2 - vh / 2;
        el.style.transform = `translate3d(0, ${center * speed * -0.12}px, 0)`;
      });
      ticking = false;
    }
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ---------------------------------------------------------
     MARQUEE : duplique le contenu pour boucle continue
  --------------------------------------------------------- */
  function initMarquee() {
    document.querySelectorAll(".track[data-dup]").forEach((t) => { t.innerHTML += t.innerHTML; });
  }

  /* ---------------------------------------------------------
     FORM
  --------------------------------------------------------- */
  function initForm() {
    const form = document.querySelector("#brief-form");
    if (!form) return;
    // Email de réception (FormSubmit, sans inscription) — vaut pour les deux marques.
    const ENDPOINT = "https://formsubmit.co/ajax/mickael@arkt-conseil.com";
    const submitBtn = form.querySelector('button[type="submit"]');
    // Empêche de choisir une date passée pour l'événement.
    const deadline = form.querySelector('input[name="deadline"]');
    if (deadline) deadline.min = new Date().toISOString().split("T")[0];

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // La validation HTML native (champs "required") bloque déjà l'envoi si incomplet.
      const brand = document.documentElement.getAttribute("data-brand") === "hors-doeuvre" ? "Hors d'Œuvre" : "Ça Parle";
      const data = new FormData(form);
      data.append("Marque", brand);
      data.append("_subject", "Nouvelle demande — " + brand);
      data.append("_template", "table");
      data.append("_captcha", "false");

      const original = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Envoi…"; }

      fetch(ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: data })
        .then((r) => r.json().catch(() => ({})).then((j) => ({ ok: r.ok, j })))
        .then(({ ok }) => {
          if (!ok) throw new Error("HTTP");
          form.querySelector(".form-grid").style.display = "none";
          document.querySelector(".form-ok").classList.add("show");
        })
        .catch(() => {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = original; }
          alert("L'envoi a échoué. Réessayez, ou écrivez directement à mickael@arkt-conseil.com.");
        });
    });
  }

  /* ---------------------------------------------------------
     RÉSEAUX SOCIAUX (logos)
  --------------------------------------------------------- */
  const CP_IG = "https://www.instagram.com/caparle.event";
  const HDO_IG = "https://www.instagram.com/horsdoeuvre_foodstudio/";
  const SVG_IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>';
  const SVG_FB = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.3h2.45l.37-2.85H13.5V9.04c0-.82.23-1.38 1.41-1.38h1.5V5.11c-.26-.03-1.15-.11-2.18-.11-2.16 0-3.64 1.32-3.64 3.74v2.08H8.13v2.85h2.46V21h2.91z"/></svg>';
  const SVG_LI = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3.4 9h3.16v11.5H3.4V9zm5.13 0h3.03v1.57h.04c.42-.8 1.45-1.65 2.98-1.65 3.19 0 3.78 2.1 3.78 4.83v6.75h-3.16v-5.98c0-1.43-.03-3.26-1.99-3.26-1.99 0-2.29 1.55-2.29 3.15v6.09H8.53V9z"/></svg>';
  const socialRow = (ig) =>
    '<a href="' + ig + '" target="_blank" rel="noopener" aria-label="Instagram" data-hover>' + SVG_IG + "</a>" +
    '<a href="[FACEBOOK_URL]" aria-label="Facebook" data-hover>' + SVG_FB + "</a>" +
    '<a href="[LINKEDIN_URL]" aria-label="LinkedIn" data-hover>' + SVG_LI + "</a>";

  /* ---------------------------------------------------------
     CONTENU brand-aware — bascule des textes Ça Parle ⇄ Hors d'Œuvre
  --------------------------------------------------------- */
  const HDO = {
    heroTitle: 'On ne sert pas à manger. On crée une <em>impulsion</em>.',
    heroSub: "Studio food événementiel du groupe Ça Parle. La cuisine devient un terrain de création — Marseille et partout ailleurs.",
    heroPill: "FOOD STUDIO",
    ctaBrief: 'Passons à table <span class="arrow">→</span>',
    msHint: '<span class="bt-arrow">←</span> Notre agence évènementiel',
    navAgence: "Le studio",
    adn:
      '\n      <span class="item">INSTINCT</span>\n      <span class="item">PRÉCISION</span>\n      <span class="item">LIBERTÉ</span>\n      <span class="item">AVANT-GARDE</span>\n      <span class="item">GOÛT</span>\n    ',
    mLead: 'Hors d\'Œuvre traite la <b>table comme une pièce</b> — chaque événement est une composition.',
    mBody:
      "\n        <p>Hors d'Œuvre est un food studio événementiel qui transforme la gastronomie en expérience de marque.</p>\n        <p>Ni traiteur classique, ni simple service culinaire, Hors d'Œuvre imagine la cuisine comme un langage visuel, sensoriel et émotionnel. Chaque table, chaque plat, chaque détail devient une intention : une façon de raconter une marque, de créer une atmosphère et de provoquer un souvenir.</p>\n        <p class=\"mbody-end\">Ici, on compose des moments <b>plus qu'on ne sert à manger.</b></p>\n        <p>Des expériences pensées avec la précision d'un studio créatif, l'exigence d'une brigade et l'audace d'une direction artistique contemporaine.</p>\n      ",
    pillars:
      '\n      <div class="pillar"><div class="n">01 / INTENTION</div><h4>Une intention claire</h4><p>Chaque projet débute par une intention. On traduit l\'ADN d\'une marque en expérience sensorielle.</p></div>\n      <div class="pillar"><div class="n">02 / DIRECTION ARTISTIQUE</div><h4>La table comme composition</h4><p>Volumes, matières, couleurs, gestes, temporalité : tout s\'articule dans une esthétique maîtrisée.</p></div>\n      <div class="pillar"><div class="n">03 / AVANT-GARDE</div><h4>Avant-gardiste par essence</h4><p>On explore, on teste, on anticipe. Formats inattendus, scénographies audacieuses.</p></div>\n      <div class="pillar"><div class="n">04 / EXÉCUTION</div><h4>Exécution impeccable</h4><p>Maîtrise technique, produits rigoureusement sélectionnés, équipe experte. Une expérience irréprochable.</p></div>\n    ',
    projTitle: "Des tables<br>qui marquent.",
    projIntro: "Cocktails dînatoires, brand events, art de la table, congrès, dîners assis. Chaque format pensé pour le moment qu'il accompagne.",
    projGrid:
      '\n      <article class="proj feat reveal" data-hover>\n        <div class="media"><div class="ph" data-ph="[PROJET_1_IMAGE] · soirée de lancement — Cassis"></div></div>\n        <div class="scrim"></div>\n        <div class="meta"><span class="tag">Soirée de lancement</span><h3>Lancement<br>Ça Parle × Hors d\'Œuvre</h3><div class="loc">Cassis — soirée de lancement des deux marques.</div></div>\n      </article>\n      <article class="proj c7 reveal" data-hover>\n        <div class="media"><div class="ph" data-ph="[PROJET_2_IMAGE]"></div></div>\n        <div class="scrim"></div>\n        <div class="meta"><span class="tag">Scénographie</span><h3>Scénographie de plage</h3><div class="loc">Marseille — sur la plage.</div></div>\n      </article>\n      <article class="proj c5 reveal" data-hover>\n        <div class="media"><div class="ph" data-ph="[PROJET_3_IMAGE]"></div></div>\n        <div class="scrim"></div>\n        <div class="meta"><span class="tag">Éditorial</span><h3>Séance éditoriale</h3><div class="loc">Dans une laverie automatique.</div></div>\n      </article>\n    ',
    teamIntro: "Un collectif de talents, sous la direction d'Adrien Bacqueville. Des cuisiniers et des créatifs qui se challengent en permanence.",
    team:
      '\n    <article class="member" data-hover data-modal-bg="assets/adrien-bg.jpg">\n      <div class="avatar"><div class="ph"><img src="assets/adrien.jpg" alt="Adrien Bacqueville" style="object-position:center 45%"></div></div>\n      <div><div class="n">DIRECTION</div><h4>Adrien Bacqueville</h4><div class="role">Chef & Directeur créatif</div><p class="xp">Une cuisine instinctive, précise et contemporaine, construite autour du produit et du goût juste. Comme un directeur créatif, il impulse une vision.</p></div>\n    </article>\n    <article class="member" data-hover data-modal-bg="assets/colombine-bg.jpg">\n      <div class="avatar"><div class="ph"><img src="assets/colombine.jpg" alt="Colombine"></div></div>\n      <div><div class="n">DÉVELOPPEMENT</div><h4>Colombine</h4><div class="role">Direction & Relation clients</div><p class="xp">Pilote les projets et la relation avec les marques. Le point de contact entre les clients et le studio.</p></div>\n    </article>\n    <article class="member solo" data-hover>\n      <div class="avatar"><div class="ph logo-ph"><img src="assets/arkt.png" alt="ARKT"></div></div>\n      <div><div class="n">MARQUE & COMMUNICATION</div><h4>ARKT</h4><div class="role">Partenaire marque & communication</div><p class="xp">Accompagne Hors d\'Œuvre sur tout le volet marque et communication : stratégie de marque, identité et direction artistique.</p></div>\n    </article>\n  ',
    quotes:
      '\n      <figure class="quote"><div class="mark">“</div><p>Le banquet est tout simplement incroyable. Un festin généreux, raffiné, pensé dans le moindre détail. Dès la première bouchée, l\'effet est immédiat : impressionnant.</p><figcaption class="who">(nom) · (entreprise)</figcaption></figure>\n      <figure class="quote"><div class="mark">“</div><p>Vraiment, le buffet est ouf. Gourmand, audacieux, sans la moindre fausse note, la preuve que la food peut être un vrai spectacle. Inimitable.</p><figcaption class="who">(nom) · (entreprise)</figcaption></figure>\n      <figure class="quote"><div class="mark">“</div><p>On vient découvrir Hors d\'Œuvre pour la partie food, voir ce que ça donne… et on repart conquis. Un savoir-faire qui se goûte autant qu\'il se montre. Magnifique.</p><figcaption class="who">(nom) · (entreprise)</figcaption></figure>\n    ',
    cEyebrow: "On passe à table",
    cTitle: "Passons à table.",
    cIntro: "Dites-nous ce que vous voulez faire goûter. On compose le moment — du concept à la dernière bouchée.",
    cTypes:
      '\n            <option value="" disabled selected>Choisir…</option>\n            <option>Cocktail dînatoire</option><option>Brand event</option><option>Art de la table</option><option>Congrès</option><option>Dîner assis</option><option>Autre</option>\n          ',
    coords:
      '\n      <div class="col"><div class="k">Adresse</div><p>[à définir]</p></div>\n      <div class="col"><div class="k">Email</div><a href="#" data-hover>[à définir]</a></div>\n      <div class="col"><div class="k">Téléphone</div><a href="#" data-hover>[à définir]</a></div>\n      <div class="col"><div class="k">Réseaux</div><span class="social">' + socialRow(HDO_IG) + '</span></div>\n    ',
    footerSocial: socialRow(HDO_IG),
    formNote: "En envoyant ce brief, vous acceptez d'être recontacté par l'équipe Hors d'Œuvre.",
    footerSister: "Revenir sur Ça Parle →",
    footerTag: "Toujours avec un temps d'avance. Marseille et partout ailleurs.",
  };

  // injecte les logos sociaux Ça Parle AVANT la capture des contenus par défaut
  document.querySelectorAll('[data-social="cp"]').forEach((el) => (el.innerHTML = socialRow(CP_IG)));

  const COPY_ELS = [...document.querySelectorAll("[data-k]")];
  const DEFAULT_COPY = {};
  COPY_ELS.forEach((el) => (DEFAULT_COPY[el.dataset.k] = el.innerHTML));

  function applyCopy(brand) {
    COPY_ELS.forEach((el) => {
      const k = el.dataset.k;
      let v = brand === "hors-doeuvre" && HDO[k] != null ? HDO[k] : DEFAULT_COPY[k];
      if (k === "adn") v = v + v; // doublé pour la boucle du marquee
      if (el.innerHTML !== v) {
        el.innerHTML = v;
        // le contenu fraîchement injecté n'est pas observé par l'IntersectionObserver
        // → on le rend visible immédiatement (sinon il reste en opacity:0)
        if (el.matches(".reveal,[data-stagger]")) el.classList.add("in");
        el.querySelectorAll(".reveal,[data-stagger]").forEach((r) => r.classList.add("in"));
      }
    });
  }

  /* ---------------------------------------------------------
     BRAND SWITCH (Ça Parle ⇄ Hors d'Œuvre) + contenu
  --------------------------------------------------------- */
  function applyBrand(brand) {
    const NAMES = { "ca-parle": "ÇA\u00A0PARLE", "hors-doeuvre": "HORS\u00A0D’ŒUVRE" };
    const root = document.documentElement;
    if (brand === "ca-parle") root.removeAttribute("data-brand");
    else root.setAttribute("data-brand", brand);
    document.querySelectorAll("[data-brand-name]").forEach((el) => (el.textContent = NAMES[brand] || NAMES["ca-parle"]));
    const navLogo = document.querySelector(".nav-logo-img");
    if (navLogo) navLogo.src = brand === "hors-doeuvre" ? "assets/logo-horsdoeuvre.png" : "assets/logo-caparle.png";
    document.querySelectorAll("[data-set]").forEach((s) => s.classList.toggle("on", s.getAttribute("data-set") === brand));
    document.querySelectorAll(".bt-switch,[data-mini]").forEach((sw) => sw.setAttribute("aria-checked", brand === "hors-doeuvre" ? "true" : "false"));
    applyCopy(brand);
  }

  function initBrand() {
    const root = document.documentElement;
    const current = () => (root.getAttribute("data-brand") === "hors-doeuvre" ? "hors-doeuvre" : "ca-parle");
    const flip = () => applyBrand(current() === "ca-parle" ? "hors-doeuvre" : "ca-parle");
    document.querySelectorAll(".bt-switch,[data-mini]").forEach((sw) => sw.addEventListener("click", flip));
    document.querySelectorAll("[data-set]").forEach((s) => s.addEventListener("click", () => applyBrand(s.getAttribute("data-set"))));
    applyBrand(current()); // applique le contenu au chargement (+ double le marquee ADN)
  }

  /* ---------------------------------------------------------
     GALERIE — ouverture/fermeture de la modale
  --------------------------------------------------------- */
  function initGallery() {
    const modal = document.getElementById("gallery-modal");
    if (!modal) return;
    const close = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("gallery-open");
      document.body.style.overflow = "";
    };
    // Délégation : capte tout clic sur un élément [data-gallery] ou son enfant
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-gallery]");
      if (trigger) {
        e.preventDefault();
        e.stopPropagation();
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("gallery-open");
        document.body.style.overflow = "hidden";
        return;
      }
      if (e.target.closest(".gallery-close")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) close();
    });
  }

  /* ---------------------------------------------------------
     FICHE MEMBRE — modale ouverte au clic sur un membre de l'équipe.
     Lit les infos directement sur la carte cliquée (photo, nom, rôle,
     texte) → fonctionne pour les deux marques sans contenu en dur.
  --------------------------------------------------------- */
  function initMemberModal() {
    const modal = document.getElementById("member-modal");
    if (!modal) return;
    const photo = modal.querySelector("#mm-photo");
    const cat = modal.querySelector("#mm-cat");
    const name = modal.querySelector("#mm-name");
    const role = modal.querySelector("#mm-role");
    const text = modal.querySelector("#mm-text");
    const open = (member) => {
      const avatar = member.querySelector(".avatar");
      photo.innerHTML = avatar ? avatar.innerHTML : "";
      const pick = (sel) => { const el = member.querySelector(sel); return el ? el.textContent : ""; };
      cat.textContent = pick(".n");
      name.textContent = pick("h4");
      role.textContent = pick(".role");
      text.textContent = member.getAttribute("data-bio") || pick(".xp");
      // Fond optionnel (photo en arrière-plan, atténuée) si le membre porte data-modal-bg
      const bg = member.getAttribute("data-modal-bg");
      modal.style.background = bg
        ? "linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.88)), url('" + bg + "') center / cover no-repeat"
        : "";
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    document.addEventListener("click", (e) => {
      const member = e.target.closest(".member");
      if (member && !modal.contains(e.target)) { open(member); return; }
      if (e.target.closest(".member-close") || e.target === modal) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) close();
    });
  }

  /* ---------------------------------------------------------
     BRIEF — modale formulaire ouverte par les CTA [data-brief]
     (Briefez-nous / Passons à table) sur les deux marques.
  --------------------------------------------------------- */
  function initBriefModal() {
    const modal = document.getElementById("brief-modal");
    if (!modal) return;
    const open = () => {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const first = modal.querySelector("input[name='nom']");
      if (first) setTimeout(() => first.focus(), 50);
    };
    const close = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-brief]");
      if (trigger) { e.preventDefault(); open(); return; }
      if (e.target.closest(".brief-close") || e.target === modal) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) close();
    });
  }

  /* ---------------------------------------------------------
     PROJET — modale ouverte au clic sur une carte projet
     (contenu à compléter plus tard). Marche pour les deux marques.
  --------------------------------------------------------- */
  function initProjectModal() {
    const modal = document.getElementById("project-modal");
    if (!modal) return;
    const tag = modal.querySelector("#pm-tag");
    const title = modal.querySelector("#pm-title");
    const open = (proj) => {
      const t = proj.querySelector(".tag");
      const h = proj.querySelector("h3");
      tag.textContent = t ? t.textContent : "";
      title.innerHTML = h ? h.innerHTML : "";
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    document.addEventListener("click", (e) => {
      const proj = e.target.closest(".proj");
      if (proj && !modal.contains(e.target)) { e.preventDefault(); open(proj); return; }
      if (e.target.closest(".project-close") || e.target === modal) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) close();
    });
  }

  /* ---------------------------------------------------------
     LOADER
  --------------------------------------------------------- */
  function initLoader() {
    const loader = document.getElementById("loader");
    const reveal = () => {
      loader.classList.add("done");
      document.body.classList.add("is-ready");
    };
    if (document.readyState === "complete") setTimeout(reveal, 400);
    else addEventListener("load", () => setTimeout(reveal, 300));
    setTimeout(reveal, 1200); // garde-fou : max 1.2s
  }

  /* ---------------------------------------------------------
     BOOT — chaque init est isolé : un échec ne bloque pas le reste
  --------------------------------------------------------- */
  function safe(fn) { try { fn(); } catch (err) { console.error("[caparle]", fn.name, err); } }

  initLoader(); // toujours en premier : garantit que le loader disparaît
  [mountMetals, initNav, initCursor, initReveal, initParallax, initMarquee, initForm, initBrand, initGallery, initMemberModal, initBriefModal, initProjectModal].forEach(safe);
})();
