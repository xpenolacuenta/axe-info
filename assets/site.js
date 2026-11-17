/* Axe Info — scripts communs : en-tête, pied de page, panier « retrait au comptoir » */
(function () {
  "use strict";

  const SHOP = {
    name: "Axe Info",
    phone: "02 96 15 05 38",
    phoneHref: "tel:+33296150538",
    email: "contact@axe-info.com",
    address: "14 rue Compagnie Roger Barbe",
    city: "22300 Lannion",
    hours: ["Mardi → samedi", "10h00 – 13h00 · 14h00 – 18h30"],
    facebook: "https://www.facebook.com/axe.info/",
    instagram: "https://www.instagram.com/axeinfo/",
  };
  window.AXE = { SHOP };

  /* ---------- Icônes (SVG inline, trait 1.8) ---------- */
  const P = {
    cart: '<path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    store: '<path d="M4 10v10h16V10"/><path d="M3 4h18l-1 6H4z"/><path d="M9 20v-6h6v6"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    box: '<path d="m3 7 9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
    euro: '<path d="M17 6a7 7 0 1 0 0 12"/><path d="M4 10h10M4 14h10"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    fb: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8a0 0 0 0 1 0 0z"/>',
    ig: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    speaker: '<rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="12" cy="14" r="3.5"/><circle cx="12" cy="6.5" r="1.2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>',
    light: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    tv: '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M8 21h8M12 17v4"/>',
    mobile: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    server: '<rect x="4" y="3" width="16" height="7" rx="1.5"/><rect x="4" y="14" width="16" height="7" rx="1.5"/><path d="M8 6.5h.01M8 17.5h.01"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 5 5"/>',
    party: '<path d="M4 20 9 5l10 10z"/><path d="M14 4l1-2M19 8l2-1M17 3l-1 2"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
    cup: '<path d="M5 4h12v6a6 6 0 0 1-12 0z"/><path d="M17 6h2a2 2 0 0 1 0 4h-2M8 20h6M11 16v4"/>',
    bed: '<path d="M3 18V7M3 13h18v5M21 13a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="10.5" r="1.5"/>',
    book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    dove: '<path d="M12 21c-4-2-7-5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 12c0 4-3 7-7 9z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  };
  const icon = (n, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${P[n] || ""}</svg>`;
  window.AXE.icon = icon;

  // Remplace les <i data-icon="x"></i> par le SVG correspondant
  function hydrateIcons(root = document) {
    root.querySelectorAll("i[data-icon]").forEach((el) => { el.outerHTML = icon(el.dataset.icon); });
  }
  window.AXE.hydrateIcons = hydrateIcons;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const euro = (n) => Number(n || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  window.AXE.esc = esc;
  window.AXE.euro = euro;

  /* ---------- En-tête et pied de page ---------- */
  const page = document.body.dataset.page || "";
  const links = [
    ["index.html", "Accueil", "home"],
    ["index.html#services", "Services", "services"],
    ["boutique.html", "Boutique", "boutique"],
    ["pro.html", "Pro & location sono", "pro"],
    ["index.html#contact", "Contact", "contact"],
  ];

  const header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header" + (header.dataset.solid !== undefined ? " solid" : "");
    header.innerHTML = `
      <div class="container nav">
        <a href="index.html" class="logo" aria-label="Axe Info, accueil"><img src="images/logo.png" alt="Axe Info" width="77" height="46"></a>
        <ul class="nav-links" id="nav-links">
          ${links.map(([h, l, k]) => `<li><a href="${h}" class="${k === page ? "active" : ""}">${l}</a></li>`).join("")}
        </ul>
        <div class="nav-actions">
          <a href="index.html#devis" class="btn btn-primary btn-sm btn-devis">Demandez un devis</a>
          <button class="cart-btn" id="cart-open" aria-label="Ma réservation">${icon("cart")}<span class="cart-count" id="cart-count" data-n="0">0</span></button>
          <button class="burger" id="burger" aria-label="Menu" aria-expanded="false">${icon("menu")}</button>
        </div>
      </div>`;
    const burger = document.getElementById("burger");
    const nav = document.getElementById("nav-links");
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
      burger.innerHTML = icon(open ? "close" : "menu");
    });
    nav.addEventListener("click", (e) => { if (e.target.tagName === "A") { nav.classList.remove("open"); burger.innerHTML = icon("menu"); } });
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div>
            <img src="images/logo.png" alt="Axe Info" style="height:56px;width:auto;margin-bottom:14px">
            <p class="muted" style="max-width:320px">Votre magasin informatique &amp; Hi-Fi au cœur de Lannion depuis 2014. Vente, réparation, installation et location de sono pour particuliers et professionnels.</p>
            <div class="socials">
              <a href="${SHOP.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${icon("fb")}</a>
              <a href="${SHOP.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${icon("ig")}</a>
            </div>
          </div>
          <div><h4>Magasin</h4><ul>
            <li><a href="index.html#services">Nos services</a></li>
            <li><a href="boutique.html">Boutique · retrait au comptoir</a></li>
            <li><a href="index.html#equipe">L'équipe</a></li>
            <li><a href="https://www.cabasse-lannion.com/" target="_blank" rel="noopener">Espace Cabasse Lannion</a></li>
          </ul></div>
          <div><h4>Pro &amp; Sono</h4><ul>
            <li><a href="pro.html#location">Location de sono</a></li>
            <li><a href="pro.html#particuliers">Particuliers</a></li>
            <li><a href="pro.html#professionnels">Professionnels</a></li>
            <li><a href="https://www.location-sono-lannion.com/" target="_blank" rel="noopener">Sono and Lights</a></li>
          </ul></div>
          <div><h4>Contact</h4><ul>
            <li>${SHOP.address}<br>${SHOP.city}</li>
            <li><a href="${SHOP.phoneHref}">${SHOP.phone}</a></li>
            <li><a href="mailto:${SHOP.email}">${SHOP.email}</a></li>
            <li>${SHOP.hours.join("<br>")}</li>
          </ul></div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Axe Info · Lannion</span>
          <span><a href="mentions-legales.html">Mentions légales</a></span>
        </div>
      </div>`;
  }

  /* ---------- Révélation au défilement ---------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 }) : null;
  window.AXE.observeReveal = (root = document) => root.querySelectorAll(".reveal:not(.in)").forEach((el) => io ? io.observe(el) : el.classList.add("in"));
  window.AXE.observeReveal();
  hydrateIcons();

  /* ---------- Toast ---------- */
  let toastEl, toastT;
  window.AXE.toast = (msg) => {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.appendChild(toastEl); }
    toastEl.innerHTML = icon("check", 'style="width:18px;height:18px;color:#3ccf8e"') + esc(msg);
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 2400);
  };

  /* ---------- Panier (réservation retrait au comptoir) ---------- */
  const KEY = "axe-reservation";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* stockage indisponible */ } };
  let cart = load();

  const Cart = {
    items: () => cart,
    count: () => cart.reduce((s, i) => s + i.qty, 0),
    total: () => cart.reduce((s, i) => s + i.qty * i.price, 0),
    add(p, qty = 1) {
      const max = Math.max(0, Number(p.stock ?? 99));
      const line = cart.find((i) => i.id === p.id);
      if (line) line.qty = Math.min(max, line.qty + qty);
      else cart.push({ id: p.id, name: p.name, brand: p.brand || "", price: Number(p.promo_price || p.price), image: p.image || "", qty: Math.min(max, qty), max });
      save(cart); render(); window.AXE.toast("Ajouté à votre réservation");
    },
    set(id, qty) {
      const line = cart.find((i) => i.id === id);
      if (!line) return;
      line.qty = Math.max(0, Math.min(line.max || 99, qty));
      cart = cart.filter((i) => i.qty > 0);
      save(cart); render();
    },
    clear() { cart = []; save(cart); render(); },
    open() { drawer.classList.add("open"); overlay.classList.add("open"); },
    close() { drawer.classList.remove("open"); overlay.classList.remove("open"); showStep("cart"); },
  };
  window.AXE.cart = Cart;

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  const drawer = document.createElement("aside");
  drawer.className = "drawer";
  drawer.setAttribute("aria-label", "Ma réservation");
  drawer.innerHTML = `
    <header><h3>Ma réservation</h3><button class="icon-btn" data-close aria-label="Fermer">${icon("close")}</button></header>
    <div class="content" id="cart-content"></div>
    <footer id="cart-footer"></footer>`;
  if (page !== "admin") document.body.append(overlay, drawer);
  overlay.addEventListener("click", () => { Cart.close(); });
  drawer.querySelector("[data-close]").addEventListener("click", () => Cart.close());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") Cart.close(); });
  document.getElementById("cart-open")?.addEventListener("click", () => Cart.open());

  let step = "cart";
  function showStep(s) { step = s; render(); }

  function render() {
    const n = Cart.count();
    const badge = document.getElementById("cart-count");
    if (badge) { badge.textContent = n; badge.dataset.n = n; }
    const content = document.getElementById("cart-content");
    const foot = document.getElementById("cart-footer");
    if (!content) return;

    if (step === "done") return;

    if (!cart.length) {
      content.innerHTML = `<div class="empty">${icon("cart", 'style="width:42px;height:42px;margin:0 auto 12px;opacity:.5"')}<p>Votre réservation est vide.</p><a class="btn btn-ghost btn-sm" href="boutique.html">Voir la boutique</a></div>`;
      foot.innerHTML = "";
      return;
    }

    if (step === "cart") {
      content.innerHTML = cart.map((i) => `
        <div class="line-item">
          ${i.image ? `<img src="${esc(i.image)}" alt="">` : `<div class="ph"></div>`}
          <div>
            <div class="name">${esc(i.name)}</div>
            <div class="unit">${euro(i.price)} l'unité</div>
            <div class="qty"><button data-dec="${esc(i.id)}" aria-label="Retirer un">−</button><span>${i.qty}</span><button data-inc="${esc(i.id)}" aria-label="Ajouter un">+</button></div>
          </div>
          <div style="text-align:right"><div class="price" style="font-size:1rem">${euro(i.qty * i.price)}</div><button class="remove" data-rm="${esc(i.id)}">Retirer</button></div>
        </div>`).join("");
      foot.innerHTML = `
        <div class="total-row"><span>Total</span><span>${euro(Cart.total())}</span></div>
        <div class="pay-note">${icon("store")}<span><strong>Aucun paiement en ligne.</strong> Vous réservez, nous préparons vos articles et vous réglez au comptoir lors du retrait (CB, espèces, chèque).</span></div>
        <button class="btn btn-primary" id="to-form">Réserver pour retrait</button>`;
      content.querySelectorAll("[data-inc]").forEach((b) => b.onclick = () => { const l = cart.find((x) => x.id === b.dataset.inc); Cart.set(l.id, l.qty + 1); });
      content.querySelectorAll("[data-dec]").forEach((b) => b.onclick = () => { const l = cart.find((x) => x.id === b.dataset.dec); Cart.set(l.id, l.qty - 1); });
      content.querySelectorAll("[data-rm]").forEach((b) => b.onclick = () => Cart.set(b.dataset.rm, 0));
      document.getElementById("to-form").onclick = () => showStep("form");
    }

    if (step === "form") {
      content.innerHTML = `
        <p class="muted" style="font-size:.92rem">Indiquez vos coordonnées : nous vous appelons ou vous écrivons dès que votre commande est prête. Elle reste réservée <strong style="color:#fff">7 jours</strong> au magasin.</p>
        <form class="form" id="reserve-form" style="padding:0" novalidate>
          <div class="form-row">
            <label class="field">Prénom<input class="input" name="first_name" required autocomplete="given-name"></label>
            <label class="field">Nom<input class="input" name="last_name" required autocomplete="family-name"></label>
          </div>
          <label class="field">Téléphone<input class="input" name="phone" type="tel" required autocomplete="tel"></label>
          <label class="field">E-mail<input class="input" name="email" type="email" required autocomplete="email"></label>
          <label class="field">Message (facultatif)<textarea class="input" name="note" style="min-height:80px" placeholder="Jour de passage souhaité, question…"></textarea></label>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
          <div id="reserve-msg"></div>
        </form>`;
      foot.innerHTML = `
        <div class="total-row"><span>${n} article${n > 1 ? "s" : ""}</span><span>${euro(Cart.total())}</span></div>
        <div class="pay-note">${icon("pin")}<span>Retrait : ${SHOP.address}, ${SHOP.city}<br>${SHOP.hours.join(", ")}</span></div>
        <div style="display:flex;gap:10px"><button class="btn btn-ghost" id="back-cart" style="flex:none">Retour</button><button class="btn btn-primary" id="send-res" style="flex:1">Confirmer la réservation</button></div>`;
      document.getElementById("back-cart").onclick = () => showStep("cart");
      document.getElementById("send-res").onclick = submitReservation;
    }
  }

  async function submitReservation() {
    const form = document.getElementById("reserve-form");
    const msg = document.getElementById("reserve-msg");
    const data = Object.fromEntries(new FormData(form));
    if (!data.first_name || !data.last_name || !data.phone || !/^\S+@\S+\.\S+$/.test(data.email || "")) {
      msg.innerHTML = `<div class="alert alert-err">Merci de renseigner votre nom, votre téléphone et un e-mail valide.</div>`;
      return;
    }
    const btn = document.getElementById("send-res");
    btn.disabled = true; btn.textContent = "Envoi…";
    try {
      const res = await fetch("api.php?action=reserve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, items: cart.map((i) => ({ id: i.id, qty: i.qty })) }),
      });
      const out = await res.json();
      if (!res.ok || !out.ok) throw new Error(out.error || "Erreur");
      step = "done";
      document.getElementById("cart-content").innerHTML = `
        <div class="empty" style="color:var(--text)">
          ${icon("check", 'style="width:56px;height:56px;margin:0 auto 14px;color:#3ccf8e"')}
          <h3>Réservation n° ${esc(out.reference)} envoyée</h3>
          <p class="muted">Merci ${esc(data.first_name)} ! Nous préparons vos articles et vous prévenons dès qu'ils sont prêts. Le règlement se fait au comptoir, lors du retrait.</p>
          <p class="muted" style="font-size:.88rem">${SHOP.address}, ${SHOP.city}<br>${SHOP.hours.join(" · ")}</p>
        </div>`;
      document.getElementById("cart-footer").innerHTML = `<button class="btn btn-primary" id="done-close">Fermer</button>`;
      document.getElementById("done-close").onclick = () => Cart.close();
      cart = []; save(cart);
      const badge = document.getElementById("cart-count"); if (badge) { badge.textContent = 0; badge.dataset.n = 0; }
      document.dispatchEvent(new CustomEvent("axe:reserved"));
    } catch (e) {
      msg.innerHTML = `<div class="alert alert-err">${esc(e.message)}. Vous pouvez aussi nous appeler au ${SHOP.phone}.</div>`;
      btn.disabled = false; btn.textContent = "Confirmer la réservation";
    }
  }

  render();
})();
