#!/usr/bin/env python3
"""Serveur de test LOCAL pour le site Axe Info (sans PHP).

Reproduit api.php en Python pour pouvoir essayer le site et le backoffice sur cet ordinateur.
En production, c'est api.php qui est utilisé (hébergement PHP classique, ex. Hostinger).

    python3 tools/dev_server.py   puis ouvrir http://localhost:8080
"""
import base64, datetime, http.server, json, os, re, secrets, socketserver, sys, threading
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
UPL = os.path.join(ROOT, "uploads")
PORT = int(os.environ.get("PORT", "8080"))
_CFG = open(os.path.join(ROOT, "config.php"), encoding="utf-8").read()
PASSWORD = re.search(r"'admin_password'\s*=>\s*'([^']*)'", _CFG).group(1)
USER = re.search(r"'admin_user'\s*=>\s*'([^']*)'", _CFG).group(1)
LOCK = threading.Lock()
SESSIONS = set()


def now(): return datetime.datetime.now().astimezone().isoformat(timespec="seconds")
def uid(p): return p + secrets.token_hex(5)
def s(v, n=500): return str(v or "").strip()[:n]
def valid_email(e): return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", e or ""))


def read(name):
    seed = os.path.join(DATA, name + ".seed.json")
    if not os.path.exists(os.path.join(DATA, name + ".json")) and os.path.exists(seed):
        with open(seed, encoding="utf-8") as f: return json.load(f)
    try:
        with open(os.path.join(DATA, name + ".json"), encoding="utf-8") as f: return json.load(f)
    except FileNotFoundError: return []


def write(name, d):
    with open(os.path.join(DATA, name + ".json"), "w", encoding="utf-8") as f: json.dump(d, f, ensure_ascii=False, indent=2)


class Fail(Exception):
    def __init__(self, msg, code=400): super().__init__(msg); self.code = code


def sanitize(i, old=None):
    p = dict(old) if old else {"id": uid("p_"), "created_at": now()}
    p["name"] = s(i.get("name"), 160)
    p["brand"] = s(i.get("brand"), 60)
    p["category"] = s(i.get("category"), 60) or "Divers"
    p["price"] = round(max(0.0, float(i.get("price") or 0)), 2)
    promo = float(i.get("promo_price") or 0)
    p["promo_price"] = round(promo, 2) if 0 < promo < p["price"] else None
    p["condition"] = "occasion" if i.get("condition") == "occasion" else "neuf"
    p["stock"] = max(0, int(float(i.get("stock") or 0)))
    p["description"] = s(i.get("description"), 4000)
    img = s(i.get("image"), 300)
    p["image"] = img if re.match(r"^(uploads/|images/|https://)", img) else ""
    p["featured"] = bool(i.get("featured"))
    p["visible"] = ("visible" not in i) or bool(i.get("visible"))
    p["updated_at"] = now()
    if not p["name"]: raise Fail("Le nom du produit est obligatoire")
    return p


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)

    def log_message(self, fmt, *args): sys.stderr.write("%s\n" % (fmt % args))

    def send_json(self, data, code=200, cookie=None):
        b = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        if cookie is not None: self.send_header("Set-Cookie", cookie)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers(); self.wfile.write(b)

    def admin(self):
        m = re.search(r"axeadmin=([a-f0-9]+)", self.headers.get("Cookie", ""))
        return m and m.group(1) in SESSIONS

    def do_GET(self):
        u = urlparse(self.path)
        if u.path.startswith("/data/") or u.path.endswith(".php") and u.path != "/api.php": return self.send_error(403)
        if u.path == "/api.php": return self.api("GET", parse_qs(u.query).get("action", [""])[0])
        super().do_GET()

    def do_POST(self):
        u = urlparse(self.path)
        if u.path != "/api.php": return self.send_error(405)
        self.api("POST", parse_qs(u.query).get("action", [""])[0])

    def body(self):
        if self.command != "POST": raise Fail("Méthode non autorisée", 405)
        if not self.headers.get("Content-Type", "").startswith("application/json"): raise Fail("Format invalide", 415)
        n = int(self.headers.get("Content-Length", 0))
        try: return json.loads(self.rfile.read(n) or b"{}")
        except ValueError: return {}

    def need_admin(self):
        if not self.admin(): raise Fail("Non connecté", 401)

    def api(self, method, action):
        try:
            with LOCK: self.route(action)
        except Fail as e:
            self.send_json({"ok": False, "error": str(e)}, e.code)

    def route(self, a):
        if a == "products":
            return self.send_json({"ok": True, "products": [{k: v for k, v in p.items() if k != "visible"} for p in read("catalogue") if p.get("visible")]})
        if a == "reserve":
            d = self.body()
            if d.get("website"): return self.send_json({"ok": True, "reference": "AX-0000"})
            first, last, phone, email = s(d.get("first_name"), 60), s(d.get("last_name"), 60), s(d.get("phone"), 30), s(d.get("email"), 120)
            if not (first and last and phone and valid_email(email)): raise Fail("Coordonnées incomplètes")
            wanted = {}
            for it in d.get("items") or []:
                i, q = s(it.get("id"), 40), int(it.get("qty") or 0)
                if i and q > 0: wanted[i] = min(20, wanted.get(i, 0) + q)
            if not wanted: raise Fail("Votre réservation est vide")
            cat = read("catalogue")
            hits = [p for p in cat if p["id"] in wanted and p.get("visible")]
            if len(hits) != len(wanted): raise Fail("Un article n'est plus disponible, merci de rafraîchir la page", 409)
            for p in hits:
                if p["stock"] < wanted[p["id"]]: raise Fail(f"Stock insuffisant pour « {p['name']} » (reste {p['stock']})", 409)
            lines = []
            for p in hits:
                p["stock"] -= wanted[p["id"]]
                lines.append({"id": p["id"], "name": p["name"], "brand": p["brand"], "qty": wanted[p["id"]], "price": float(p.get("promo_price") or p["price"])})
            write("catalogue", cat)
            ref = "AX-" + datetime.date.today().strftime("%y%m%d") + "-" + secrets.token_hex(2).upper()
            res = read("reservations")
            res.insert(0, {"id": uid("r_"), "reference": ref, "status": "nouvelle", "created_at": now(), "updated_at": now(),
                           "customer": {"first_name": first, "last_name": last, "phone": phone, "email": email},
                           "note": s(d.get("note"), 1000), "items": lines, "total": round(sum(l["qty"] * l["price"] for l in lines), 2), "stock_applied": True})
            write("reservations", res)
            print(f"[e-mail simulé] Nouvelle réservation {ref} pour {first} {last}")
            return self.send_json({"ok": True, "reference": ref})
        if a == "contact":
            d = self.body()
            if d.get("website"): return self.send_json({"ok": True})
            m = {"id": uid("m_"), "created_at": now(), "read": False, "name": s(d.get("name"), 100), "email": s(d.get("email"), 120),
                 "phone": s(d.get("phone"), 30), "subject": s(d.get("subject"), 80), "message": s(d.get("message"), 4000)}
            if not (m["name"] and valid_email(m["email"]) and m["message"]): raise Fail("Champs manquants")
            msgs = read("messages"); msgs.insert(0, m); write("messages", msgs[:500])
            print(f"[e-mail simulé] Demande de devis de {m['name']}")
            return self.send_json({"ok": True})
        if a == "login":
            d = self.body()
            ok_user = secrets.compare_digest(USER, str(d.get("user", "")))
            ok_pass = secrets.compare_digest(PASSWORD, str(d.get("password", "")))
            if not (ok_user and ok_pass): raise Fail("Identifiant ou mot de passe incorrect", 401)
            tok = secrets.token_hex(16); SESSIONS.add(tok)
            return self.send_json({"ok": True}, cookie=f"axeadmin={tok}; HttpOnly; SameSite=Strict; Path=/")
        if a == "logout":
            self.body(); return self.send_json({"ok": True}, cookie="axeadmin=; Max-Age=0; Path=/")
        if a == "me":
            return self.send_json({"ok": True, "admin": bool(self.admin())})

        self.need_admin()
        if a == "admin_products":
            return self.send_json({"ok": True, "products": read("catalogue")})
        if a == "save_product":
            d = self.body(); cat = read("catalogue"); pid = s(d.get("id"), 40)
            if pid:
                idx = next((i for i, p in enumerate(cat) if p["id"] == pid), None)
                if idx is None: raise Fail("Produit introuvable", 404)
                cat[idx] = sanitize(d, cat[idx]); saved = cat[idx]
            else:
                saved = sanitize(d); cat.insert(0, saved)
            write("catalogue", cat)
            return self.send_json({"ok": True, "product": saved})
        if a == "delete_product":
            pid = s(self.body().get("id"), 40)
            write("catalogue", [p for p in read("catalogue") if p["id"] != pid])
            return self.send_json({"ok": True})
        if a == "upload_image":
            m = re.match(r"^data:image/(jpeg|png|webp);base64,(.+)$", str(self.body().get("data", "")), re.S)
            if not m: raise Fail("Image invalide (JPEG, PNG ou WebP)")
            b = base64.b64decode(m.group(2))
            os.makedirs(UPL, exist_ok=True)
            name = datetime.date.today().strftime("%Y%m%d") + "-" + secrets.token_hex(6) + "." + {"jpeg": "jpg"}.get(m.group(1), m.group(1))
            open(os.path.join(UPL, name), "wb").write(b)
            return self.send_json({"ok": True, "url": "uploads/" + name})
        if a == "reservations":
            return self.send_json({"ok": True, "reservations": read("reservations")})
        if a == "reservation_status":
            d = self.body(); rid, st = s(d.get("id"), 40), s(d.get("status"), 20)
            if st not in ("nouvelle", "prete", "retiree", "annulee"): raise Fail("Statut invalide")
            res = read("reservations"); r = next((x for x in res if x["id"] == rid), None)
            if not r: raise Fail("Réservation introuvable", 404)
            r["status"] = st; r["updated_at"] = now()
            must = st != "annulee"
            if r.get("stock_applied", True) != must:
                sign = -1 if must else 1; cat = read("catalogue")
                for l in r["items"]:
                    for p in cat:
                        if p["id"] == l["id"]: p["stock"] = max(0, p["stock"] + sign * l["qty"])
                write("catalogue", cat); r["stock_applied"] = must
            write("reservations", res)
            if st == "prete": print(f"[e-mail simulé] Réservation {r['reference']} prête, client prévenu")
            return self.send_json({"ok": True})
        if a == "messages":
            return self.send_json({"ok": True, "messages": read("messages")})
        if a == "message_read":
            mid = s(self.body().get("id"), 40); msgs = read("messages")
            for m in msgs:
                if m["id"] == mid: m["read"] = True
            write("messages", msgs)
            return self.send_json({"ok": True})
        raise Fail("Action inconnue", 404)


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    print(f"Site Axe Info : http://localhost:{PORT}   ·   Backoffice : http://localhost:{PORT}/admin/")
    Server(("127.0.0.1", PORT), H).serve_forever()
