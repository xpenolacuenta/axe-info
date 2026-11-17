/* Boutique : catalogue chargé depuis api.php?action=products */
(function () {
  const { esc, euro, icon, cart } = window.AXE;
  const $ = (s) => document.querySelector(s);
  let products = [];
  const params = new URLSearchParams(location.search);
  const state = { cat: params.get("cat") || "", q: "", cond: "", sort: "featured" };

  const effective = (p) => Number(p.promo_price || p.price || 0);
  const stockInfo = (p) => {
    const s = Number(p.stock || 0);
    if (s <= 0) return { cls: "out", txt: "Sur commande" };
    if (s <= 2) return { cls: "low", txt: `Plus que ${s} en stock` };
    return { cls: "", txt: "En stock" };
  };
  const thumb = (p, cls = "") => p.image
    ? `<div class="thumb ${cls}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></div>`
    : `<div class="thumb ${cls}"><div class="noimg">${icon("box")}</div></div>`;
  const badges = (p) => {
    const b = [];
    if (p.promo_price && Number(p.promo_price) < Number(p.price)) b.push(`<span class="badge promo">-${Math.round(100 - (p.promo_price / p.price) * 100)} %</span>`);
    if (p.condition === "occasion") b.push(`<span class="badge used">Occasion</span>`);
    return b.length ? `<div class="badges">${b.join("")}</div>` : "";
  };
  const priceHtml = (p) => p.promo_price && Number(p.promo_price) < Number(p.price)
    ? `${euro(p.promo_price)}<s>${euro(p.price)}</s>` : euro(p.price);

  function categories() {
    const map = new Map();
    products.forEach((p) => map.set(p.category, (map.get(p.category) || 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  }

  function renderCats() {
    const cats = categories();
    const all = [["", products.length, "Tous les produits"], ...cats.map(([c, n]) => [c, n, c])];
    $("#cat-list").innerHTML = all.map(([c, n, l]) => `<button data-cat="${esc(c)}" class="${state.cat === c ? "active" : ""}">${esc(l)}<small>${n}</small></button>`).join("");
    $("#cat-pills").innerHTML = all.map(([c, , l]) => `<button data-cat="${esc(c)}" class="${state.cat === c ? "active" : ""}">${esc(l)}</button>`).join("");
    document.querySelectorAll("[data-cat]").forEach((b) => b.onclick = () => {
      state.cat = b.dataset.cat;
      const u = new URL(location); state.cat ? u.searchParams.set("cat", state.cat) : u.searchParams.delete("cat"); history.replaceState(null, "", u);
      renderCats(); renderList();
    });
  }

  function filtered() {
    const q = state.q.trim().toLowerCase();
    let list = products.filter((p) =>
      (!state.cat || p.category === state.cat) &&
      (!state.cond || p.condition === state.cond) &&
      (!q || [p.name, p.brand, p.category, p.description].join(" ").toLowerCase().includes(q)));
    const by = {
      featured: (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.updated_at || "").localeCompare(a.updated_at || ""),
      "price-asc": (a, b) => effective(a) - effective(b),
      "price-desc": (a, b) => effective(b) - effective(a),
      name: (a, b) => a.name.localeCompare(b.name, "fr"),
    }[state.sort];
    return list.sort(by);
  }

  function renderList() {
    const list = filtered();
    $("#count").textContent = `${list.length} produit${list.length > 1 ? "s" : ""}${state.cat ? " · " + state.cat : ""}`;
    if (!list.length) { $("#products").innerHTML = `<div class="empty" style="grid-column:1/-1">Aucun produit ne correspond à votre recherche.<br>Une question ? Appelez-nous au 02 96 15 05 38.</div>`; return; }
    $("#products").innerHTML = list.map((p) => {
      const s = stockInfo(p);
      return `<article class="card product" data-id="${esc(p.id)}" tabindex="0">
        <div style="position:relative">${thumb(p)}${badges(p)}</div>
        <div class="body">
          <span class="brandname">${esc(p.brand || p.category)}</span>
          <h3>${esc(p.name)}</h3>
          <span class="stock ${s.cls}">${s.txt}</span>
          <div class="foot"><span class="price">${priceHtml(p)}</span>
            <button class="add-btn" data-add="${esc(p.id)}" ${Number(p.stock) <= 0 ? "disabled" : ""} aria-label="Ajouter ${esc(p.name)} à la réservation">${icon("plus")}</button></div>
        </div></article>`;
    }).join("");
    document.querySelectorAll("[data-add]").forEach((b) => b.onclick = (e) => { e.stopPropagation(); cart.add(products.find((p) => p.id === b.dataset.add)); });
    document.querySelectorAll(".product").forEach((c) => {
      c.onclick = () => openProduct(c.dataset.id);
      c.onkeydown = (e) => { if (e.key === "Enter") openProduct(c.dataset.id); };
    });
  }

  const modal = $("#pm"), ov = $("#pm-overlay");
  function openProduct(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const s = stockInfo(p);
    const out = Number(p.stock) <= 0;
    $("#pm-panel").innerHTML = `
      <button class="icon-btn close" aria-label="Fermer">${icon("close")}</button>
      <div class="pdetail">
        <div class="img" style="position:relative">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}">` : `<div class="noimg" style="color:#888">${icon("box", 'style="width:64px;height:64px"')}</div>`}${badges(p)}</div>
        <div class="info-p">
          <span class="brandname" style="color:var(--violet-soft);text-transform:uppercase;letter-spacing:.1em;font-size:.8rem">${esc(p.brand)} · ${esc(p.category)}</span>
          <h2 style="font-size:1.8rem;margin:0">${esc(p.name)}</h2>
          <div class="price" style="font-size:1.8rem">${priceHtml(p)}</div>
          <span class="stock ${s.cls}">${s.txt} · ${p.condition === "occasion" ? "Occasion" : "Neuf"}</span>
          ${p.description ? `<div class="desc">${esc(p.description)}</div>` : ""}
          <div class="pay-note">${icon("store")}<span>${out ? "Article disponible sur commande : contactez-nous au 02 96 15 05 38." : "Réservez-le en ligne et réglez-le au comptoir lors du retrait. Aucun paiement en ligne."}</span></div>
          <button class="btn btn-primary" id="pm-add" ${out ? "disabled" : ""}>${icon("cart")}Ajouter à ma réservation</button>
        </div>
      </div>`;
    modal.classList.add("open"); ov.classList.add("open");
    $("#pm-panel .close").onclick = closeProduct;
    $("#pm-add").onclick = () => { cart.add(p); closeProduct(); };
  }
  function closeProduct() { modal.classList.remove("open"); ov.classList.remove("open"); }
  ov.onclick = closeProduct;
  modal.onclick = (e) => { if (e.target === modal) closeProduct(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeProduct(); });

  $("#q").addEventListener("input", (e) => { state.q = e.target.value; renderList(); });
  $("#cond").addEventListener("change", (e) => { state.cond = e.target.value; renderList(); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; renderList(); });
  document.addEventListener("axe:reserved", load);

  async function load() {
    try {
      const res = await fetch("api.php?action=products", { cache: "no-store" });
      const out = await res.json();
      products = out.products || [];
      if (state.cat && !products.some((p) => p.category === state.cat)) state.cat = "";
      renderCats(); renderList();
    } catch {
      $("#products").innerHTML = `<div class="empty" style="grid-column:1/-1">Le catalogue est momentanément indisponible. Appelez-nous au 02 96 15 05 38.</div>`;
    }
  }
  load();
})();
