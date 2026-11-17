/* Backoffice Axe Info : catalogue, réservations, demandes de devis */
(function () {
  const { esc, euro, icon, toast, hydrateIcons } = window.AXE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const API = "../api.php";
  const src = (u) => (!u ? "" : /^https?:/.test(u) ? u : "../" + u);

  async function api(action, body) {
    const opt = body === undefined ? { cache: "no-store" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
    const res = await fetch(`${API}?action=${action}`, opt);
    let out = {};
    try { out = await res.json(); } catch { /* réponse vide */ }
    if (res.status === 401 && action !== "login") { showLogin(); throw new Error("Session expirée"); }
    if (!res.ok || out.ok === false) throw new Error(out.error || `Erreur ${res.status}`);
    return out;
  }

  let products = [], reservations = [], messages = [];
  let view = "products", resFilter = "nouvelle";

  /* ---------- Connexion ---------- */
  function showLogin() { $("#app").hidden = true; $("#login").hidden = false; }
  async function showApp() {
    $("#login").hidden = true; $("#app").hidden = false;
    await Promise.all([loadProducts(), loadReservations(), loadMessages()]);
  }
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("button[type=submit]", e.target);
    btn.disabled = true;
    try {
      await api("login", { user: e.target.user.value.trim(), password: e.target.password.value });
      e.target.reset(); $("#login-msg").innerHTML = "";
      await showApp();
    } catch (err) {
      $("#login-msg").innerHTML = `<div class="alert alert-err">${esc(err.message)}</div>`;
    } finally { btn.disabled = false; }
  });
  $("#logout").onclick = async () => { await api("logout", {}).catch(() => {}); showLogin(); };

  /* ---------- Navigation ---------- */
  $$(".side [data-view]").forEach((b) => b.onclick = () => {
    view = b.dataset.view;
    $$(".side [data-view]").forEach((x) => x.classList.toggle("active", x === b));
    ["products", "reservations", "messages"].forEach((v) => $(`#view-${v}`).hidden = v !== view);
    $("#side").classList.remove("open");
    if (view === "reservations") loadReservations();
    if (view === "messages") loadMessages();
  });
  $("#side-toggle").onclick = () => $("#side").classList.toggle("open");

  /* ---------- Catalogue ---------- */
  async function loadProducts() {
    products = (await api("admin_products")).products;
    renderProducts();
  }

  function renderProducts() {
    const cats = [...new Set(products.map((p) => p.category))].sort((a, b) => a.localeCompare(b, "fr"));
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
    $("#cats").innerHTML = cats.map((c) => `<option value="${esc(c)}">`).join("");
    $("#brands").innerHTML = brands.map((c) => `<option value="${esc(c)}">`).join("");
    const pcat = $("#pcat"), cur = pcat.value;
    pcat.innerHTML = `<option value="">Toutes les catégories</option>` + cats.map((c) => `<option ${c === cur ? "selected" : ""}>${esc(c)}</option>`).join("");

    const online = products.filter((p) => p.visible).length;
    const out = products.filter((p) => p.stock <= 0).length;
    const value = products.reduce((s, p) => s + (p.promo_price || p.price) * Math.max(0, p.stock), 0);
    $("#kpis").innerHTML = `
      <div class="card kpi"><span>Articles</span><strong>${products.length}</strong></div>
      <div class="card kpi"><span>En ligne</span><strong>${online}</strong></div>
      <div class="card kpi"><span>En rupture</span><strong>${out}</strong></div>
      <div class="card kpi"><span>Valeur du stock</span><strong>${euro(value).replace(/,00/, "")}</strong></div>`;

    const q = $("#pq").value.trim().toLowerCase(), c = pcat.value, f = $("#pfilter").value;
    const list = products.filter((p) =>
      (!q || [p.name, p.brand, p.category].join(" ").toLowerCase().includes(q)) &&
      (!c || p.category === c) &&
      (!f || (f === "visible" && p.visible) || (f === "hidden" && !p.visible) || (f === "out" && p.stock <= 0) || (f === "promo" && p.promo_price)));

    $("#ptable").innerHTML = list.length ? list.map((p) => {
      const sc = p.stock <= 0 ? "out" : p.stock <= 2 ? "low" : "";
      return `<tr data-id="${esc(p.id)}">
        <td class="thumbc">${p.image ? `<img src="${esc(src(p.image))}" alt="">` : `<div class="ph"></div>`}</td>
        <td><div class="pname">${esc(p.name)}${p.featured ? ' <span title="Mis en avant" style="color:#ffc94d">★</span>' : ""}</div><div class="psub">${esc(p.brand || "—")} · ${p.condition === "occasion" ? "Occasion" : "Neuf"}</div></td>
        <td class="hide-sm">${esc(p.category)}</td>
        <td class="num">${p.promo_price ? `${euro(p.promo_price)}<div class="psub"><s>${euro(p.price)}</s></div>` : euro(p.price)}</td>
        <td><span class="stock-pill ${sc}">${p.stock}</span></td>
        <td><label class="switch" title="Visible en boutique"><input type="checkbox" data-vis="${esc(p.id)}" ${p.visible ? "checked" : ""}><span></span></label></td>
        <td><div class="row-actions"><button class="mini" data-edit="${esc(p.id)}">Modifier</button><button class="mini" data-dup="${esc(p.id)}" title="Dupliquer">Dupliquer</button></div></td>
      </tr>`;
    }).join("") : `<tr><td colspan="7" class="empty">Aucun article. Cliquez sur « Ajouter un article » pour commencer.</td></tr>`;

    $$("[data-edit]").forEach((b) => b.onclick = () => openEditor(products.find((p) => p.id === b.dataset.edit)));
    $$("[data-dup]").forEach((b) => b.onclick = () => {
      const p = products.find((x) => x.id === b.dataset.dup);
      openEditor({ ...p, id: "", name: p.name + " (copie)" });
    });
    $$("[data-vis]").forEach((cb) => cb.onchange = async () => {
      const p = products.find((x) => x.id === cb.dataset.vis);
      try { const r = await api("save_product", { ...p, visible: cb.checked }); Object.assign(p, r.product); toast(cb.checked ? "Article en ligne" : "Article masqué"); renderProducts(); }
      catch (e) { cb.checked = !cb.checked; alert(e.message); }
    });
  }
  ["#pq", "#pcat", "#pfilter"].forEach((s) => $(s).addEventListener("input", renderProducts));

  /* ---------- Éditeur ---------- */
  const ed = $("#editor"), edOv = $("#ed-overlay"), form = $("#ed-form");
  function setImage(url) {
    form.image.value = url || "";
    const d = $("#drop");
    d.classList.toggle("has", !!url);
    d.innerHTML = url ? `<img src="${esc(src(url))}" alt="">` : "Glissez une photo ici<br>ou cliquez pour choisir";
  }
  function openEditor(p) {
    form.reset();
    const isNew = !p || !p.id;
    p = p || { condition: "neuf", stock: 1, visible: true };
    $("#ed-title").textContent = isNew ? "Nouvel article" : "Modifier l'article";
    ["id", "name", "brand", "category", "price", "promo_price", "stock", "description", "condition"].forEach((k) => { if (form[k]) form[k].value = p[k] ?? ""; });
    form.visible.checked = p.visible !== false;
    form.featured.checked = !!p.featured;
    setImage(p.image);
    $("#ed-delete").style.visibility = isNew ? "hidden" : "visible";
    $("#ed-msg").innerHTML = "";
    ed.classList.add("open"); edOv.classList.add("open");
    setTimeout(() => form.name.focus(), 50);
  }
  function closeEditor() { ed.classList.remove("open"); edOv.classList.remove("open"); }
  $("#new-product").onclick = () => openEditor(null);
  $("#ed-close").onclick = $("#ed-cancel").onclick = closeEditor;
  edOv.onclick = closeEditor;
  ed.onclick = (e) => { if (e.target === ed) closeEditor(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && ed.classList.contains("open")) closeEditor(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    d.visible = form.visible.checked;
    d.featured = form.featured.checked;
    if (!d.name.trim() || !d.category.trim() || d.price === "") {
      $("#ed-msg").innerHTML = `<div class="alert alert-err">Le nom, la catégorie et le prix sont obligatoires.</div>`;
      return;
    }
    if (d.promo_price && Number(d.promo_price) >= Number(d.price)) {
      $("#ed-msg").innerHTML = `<div class="alert alert-err">Le prix promo doit être inférieur au prix normal.</div>`;
      return;
    }
    $("#ed-save").disabled = true;
    try {
      await api("save_product", d);
      closeEditor(); toast(d.id ? "Article enregistré" : "Article ajouté");
      await loadProducts();
    } catch (err) {
      $("#ed-msg").innerHTML = `<div class="alert alert-err">${esc(err.message)}</div>`;
    } finally { $("#ed-save").disabled = false; }
  });

  $("#ed-delete").onclick = async () => {
    if (!form.id.value) return;
    if (!confirm(`Supprimer définitivement « ${form.name.value} » du catalogue ?\n\nAstuce : pour le retirer temporairement, décochez plutôt « Visible en boutique ».`)) return;
    try { await api("delete_product", { id: form.id.value }); closeEditor(); toast("Article supprimé"); await loadProducts(); }
    catch (err) { alert(err.message); }
  };

  // Photo : redimensionnement dans le navigateur puis envoi
  const fileIn = $("#file"), drop = $("#drop");
  const pick = () => fileIn.click();
  drop.onclick = pick;
  drop.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } };
  $("#img-change").onclick = pick;
  $("#img-remove").onclick = () => setImage("");
  fileIn.onchange = () => fileIn.files[0] && upload(fileIn.files[0]);
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove("drag"); }));
  drop.addEventListener("drop", (e) => { const f = e.dataTransfer.files[0]; if (f) upload(f); });

  async function resize(file, max = 1200) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); // fond blanc pour les PNG transparents
      ctx.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", 0.85);
    } finally { URL.revokeObjectURL(url); }
  }
  async function upload(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { $("#ed-msg").innerHTML = `<div class="alert alert-err">Formats acceptés : JPEG, PNG, WebP.</div>`; return; }
    drop.innerHTML = "Envoi de la photo…";
    try {
      const data = await resize(file);
      const r = await api("upload_image", { data });
      setImage(r.url);
    } catch (err) {
      setImage(form.image.value);
      $("#ed-msg").innerHTML = `<div class="alert alert-err">${esc(err.message)}</div>`;
    } finally { fileIn.value = ""; }
  }

  /* ---------- Réservations ---------- */
  const ST = { nouvelle: "Nouvelle", prete: "Prête", retiree: "Retirée", annulee: "Annulée" };
  async function loadReservations() {
    reservations = (await api("reservations")).reservations;
    const n = reservations.filter((r) => r.status === "nouvelle").length;
    $("#pill-res").hidden = !n; $("#pill-res").textContent = n;
    renderReservations();
  }
  function renderReservations() {
    const counts = Object.fromEntries(Object.keys(ST).map((k) => [k, reservations.filter((r) => r.status === k).length]));
    $("#rfilters").innerHTML = [["", "Toutes", reservations.length], ...Object.entries(ST).map(([k, l]) => [k, l, counts[k]])]
      .map(([k, l, n]) => `<button data-rf="${k}" class="${resFilter === k ? "active" : ""}">${l} (${n})</button>`).join("");
    $$("[data-rf]").forEach((b) => b.onclick = () => { resFilter = b.dataset.rf; renderReservations(); });
    const list = reservations.filter((r) => !resFilter || r.status === resFilter);
    $("#rlist").innerHTML = list.length ? list.map((r) => {
      const c = r.customer;
      const d = new Date(r.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
      return `<article class="card res">
        <div class="res-head">
          <div><h3>${esc(r.reference)} · ${esc(c.first_name)} ${esc(c.last_name)}</h3><span class="psub">Reçue le ${d}</span></div>
          <span class="status st-${r.status}">${ST[r.status]}</span>
        </div>
        <div class="meta"><a href="tel:${esc(c.phone)}">${esc(c.phone)}</a><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div>
        <ul>${r.items.map((i) => `<li>${i.qty} × ${esc(i.name)} · ${euro(i.qty * i.price)}</li>`).join("")}</ul>
        ${r.note ? `<div class="pay-note">${icon("mail")}<span>${esc(r.note)}</span></div>` : ""}
        <div class="res-head">
          <strong class="price" style="font-size:1.15rem">Total à régler au comptoir : ${euro(r.total)}</strong>
          <div class="row-actions">
            ${r.status !== "prete" ? `<button class="mini" data-st="prete" data-id="${r.id}" title="Prévient le client par e-mail">Marquer prête</button>` : ""}
            ${r.status !== "retiree" ? `<button class="mini" data-st="retiree" data-id="${r.id}">Retirée &amp; payée</button>` : ""}
            ${r.status !== "annulee" ? `<button class="mini danger" data-st="annulee" data-id="${r.id}" title="Remet les articles en stock">Annuler</button>` : `<button class="mini" data-st="nouvelle" data-id="${r.id}">Rétablir</button>`}
          </div>
        </div>
      </article>`;
    }).join("") : `<div class="empty">Aucune réservation ${resFilter ? "dans cette catégorie" : "pour le moment"}.</div>`;
    $$("[data-st]").forEach((b) => b.onclick = async () => {
      const st = b.dataset.st;
      if (st === "annulee" && !confirm("Annuler cette réservation ? Les articles seront remis en stock.")) return;
      try {
        await api("reservation_status", { id: b.dataset.id, status: st });
        toast(st === "prete" ? "Client prévenu par e-mail" : "Réservation mise à jour");
        await Promise.all([loadReservations(), loadProducts()]);
      } catch (e) { alert(e.message); }
    });
  }

  /* ---------- Messages ---------- */
  async function loadMessages() {
    messages = (await api("messages")).messages;
    const n = messages.filter((m) => !m.read).length;
    $("#pill-msg").hidden = !n; $("#pill-msg").textContent = n;
    $("#mlist").innerHTML = messages.length ? messages.map((m) => `
      <article class="card msg ${m.read ? "" : "unread"}">
        <div class="res-head">
          <div><strong>${esc(m.subject)}</strong> · ${esc(m.name)}<div class="psub">${new Date(m.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</div></div>
          <div class="row-actions"><a class="mini" href="mailto:${esc(m.email)}">Répondre</a>${m.phone ? `<a class="mini" href="tel:${esc(m.phone)}">${esc(m.phone)}</a>` : ""}${m.read ? "" : `<button class="mini" data-read="${m.id}">Marquer lu</button>`}</div>
        </div>
        <p>${esc(m.message)}</p>
      </article>`).join("") : `<div class="empty">Aucune demande pour le moment.</div>`;
    $$("[data-read]").forEach((b) => b.onclick = async () => { await api("message_read", { id: b.dataset.read }); loadMessages(); });
  }

  /* ---------- Démarrage ---------- */
  hydrateIcons();
  api("me").then((r) => r.admin ? showApp() : showLogin()).catch(showLogin);
})();
