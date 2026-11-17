/* Envoi des formulaires de devis vers api.php?action=contact */
(function () {
  const { esc, SHOP } = window.AXE;
  document.querySelectorAll("form#devis").forEach((form) => {
    const msg = form.querySelector("#devis-msg");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      if (!data.name || !/^\S+@\S+\.\S+$/.test(data.email || "") || !data.message) {
        msg.innerHTML = `<div class="alert alert-err">Merci d'indiquer votre nom, un e-mail valide et votre message.</div>`;
        return;
      }
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        const res = await fetch("api.php?action=contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        const out = await res.json();
        if (!res.ok || !out.ok) throw new Error(out.error || "Erreur d'envoi");
        form.reset();
        msg.innerHTML = `<div class="alert alert-ok">Merci pour votre envoi ! Nous revenons vers vous très vite.</div>`;
      } catch (err) {
        msg.innerHTML = `<div class="alert alert-err">${esc(err.message)}. Appelez-nous au ${SHOP.phone}.</div>`;
      } finally { btn.disabled = false; }
    });
  });
})();
