<?php
/**
 * Axe Info : API du catalogue, des réservations (retrait au comptoir) et du backoffice.
 * Stockage dans des fichiers JSON (dossier data/, protégé par .htaccess). Aucune base de données requise.
 */
declare(strict_types=1);

if (!is_file(__DIR__ . '/config.php')) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    exit('{"ok":false,"error":"config.php manquant : copiez config.example.php en config.php sur le serveur"}');
}
$CONFIG = require __DIR__ . '/config.php';
const DATA_DIR = __DIR__ . '/data';
const UPLOAD_DIR = __DIR__ . '/uploads';
const UPLOAD_URL = 'uploads/';

session_set_cookie_params(['httponly' => true, 'samesite' => 'Strict', 'secure' => !empty($_SERVER['HTTPS'])]);
session_name('axeadmin');
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

/* ---------- Utilitaires ---------- */
function out($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function fail(string $msg, int $code = 400): void { out(['ok' => false, 'error' => $msg], $code); }

function body(): array {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('Méthode non autorisée', 405);
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($ct, 'application/json') !== 0) fail('Format invalide', 415); // bloque les formulaires croisés (CSRF)
    $raw = file_get_contents('php://input');
    if (strlen($raw) > 12 * 1024 * 1024) fail('Requête trop volumineuse', 413);
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

/** Premier lancement : le catalogue part du fichier d'exemple fourni dans le dépôt. */
function seed_if_missing(string $name): void {
    $f = DATA_DIR . "/$name.json";
    $seed = DATA_DIR . "/$name.seed.json";
    if (!is_file($f) && is_file($seed)) @copy($seed, $f);
}

function read_json(string $name): array {
    seed_if_missing($name);
    $f = DATA_DIR . "/$name.json";
    if (!is_file($f)) return [];
    $fh = fopen($f, 'r');
    flock($fh, LOCK_SH);
    $d = json_decode(stream_get_contents($fh) ?: '[]', true);
    flock($fh, LOCK_UN);
    fclose($fh);
    return is_array($d) ? $d : [];
}

/** Lecture-modification-écriture atomique d'un fichier JSON. */
function update_json(string $name, callable $fn) {
    if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0750, true);
    seed_if_missing($name);
    $f = DATA_DIR . "/$name.json";
    $fh = fopen($f, 'c+');
    flock($fh, LOCK_EX);
    $d = json_decode(stream_get_contents($fh) ?: '[]', true);
    if (!is_array($d)) $d = [];
    $result = $fn($d);
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    return $result;
}

function str($v, int $max = 500): string { return mb_substr(trim((string)($v ?? '')), 0, $max); }
function now(): string { return date('c'); }
function uid(string $prefix): string { return $prefix . bin2hex(random_bytes(5)); }

function require_admin(): void {
    if (empty($_SESSION['admin'])) fail('Non connecté', 401);
}

function send_mail(string $to, string $subject, string $text, ?string $replyTo = null): void {
    global $CONFIG;
    if (!$to) return;
    $headers = [
        'From: Axe Info <' . $CONFIG['from_email'] . '>',
        'Content-Type: text/plain; charset=utf-8',
    ];
    if ($replyTo && filter_var($replyTo, FILTER_VALIDATE_EMAIL)) $headers[] = 'Reply-To: ' . $replyTo;
    @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $text, implode("\r\n", $headers));
}

function public_product(array $p): array {
    unset($p['visible']);
    return $p;
}

function sanitize_product(array $in, ?array $old = null): array {
    $p = $old ?? ['id' => uid('p_'), 'created_at' => now()];
    $p['name']        = str($in['name'] ?? '', 160);
    $p['brand']       = str($in['brand'] ?? '', 60);
    $p['category']    = str($in['category'] ?? '', 60) ?: 'Divers';
    $p['price']       = round(max(0, (float)($in['price'] ?? 0)), 2);
    $promo            = (float)($in['promo_price'] ?? 0);
    $p['promo_price'] = ($promo > 0 && $promo < $p['price']) ? round($promo, 2) : null;
    $p['condition']   = ($in['condition'] ?? '') === 'occasion' ? 'occasion' : 'neuf';
    $p['stock']       = max(0, (int)($in['stock'] ?? 0));
    $p['description'] = str($in['description'] ?? '', 4000);
    $img              = str($in['image'] ?? '', 300);
    $p['image']       = preg_match('#^(uploads/|images/|https://)#', $img) ? $img : '';
    $p['featured']    = !empty($in['featured']);
    $p['visible']     = !array_key_exists('visible', $in) || !empty($in['visible']);
    $p['updated_at']  = now();
    if ($p['name'] === '') fail('Le nom du produit est obligatoire');
    return $p;
}

/* ---------- Routage ---------- */
$action = $_GET['action'] ?? '';

switch ($action) {

/* ===== Public ===== */
case 'products':
    $list = array_values(array_filter(read_json('catalogue'), fn($p) => !empty($p['visible'])));
    out(['ok' => true, 'products' => array_map('public_product', $list)]);

case 'reserve':
    $d = body();
    if (!empty($d['website'])) out(['ok' => true, 'reference' => 'AX-0000']); // pot de miel anti-robot
    $first = str($d['first_name'] ?? '', 60);
    $last  = str($d['last_name'] ?? '', 60);
    $phone = str($d['phone'] ?? '', 30);
    $email = str($d['email'] ?? '', 120);
    $note  = str($d['note'] ?? '', 1000);
    if (!$first || !$last || !$phone || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Coordonnées incomplètes');
    $wanted = [];
    foreach (($d['items'] ?? []) as $it) {
        $id = str($it['id'] ?? '', 40);
        $q  = (int)($it['qty'] ?? 0);
        if ($id && $q > 0) $wanted[$id] = min(20, ($wanted[$id] ?? 0) + $q);
    }
    if (!$wanted) fail('Votre réservation est vide');

    // Vérifie le stock et décrémente de façon atomique
    $lines = update_json('catalogue', function (array &$cat) use ($wanted) {
        // 1er passage : on vérifie tout avant de modifier quoi que ce soit
        $found = 0;
        foreach ($cat as $p) {
            if (!isset($wanted[$p['id']]) || empty($p['visible'])) continue;
            $found++;
            if ($p['stock'] < $wanted[$p['id']]) return ['error' => "Stock insuffisant pour « {$p['name']} » (reste {$p['stock']})"];
        }
        if ($found !== count($wanted)) return ['error' => 'Un article n\'est plus disponible, merci de rafraîchir la page'];
        // 2e passage : on décrémente
        $lines = [];
        foreach ($cat as &$p) {
            if (!isset($wanted[$p['id']]) || empty($p['visible'])) continue;
            $q = $wanted[$p['id']];
            $p['stock'] -= $q;
            $price = $p['promo_price'] ?: $p['price'];
            $lines[] = ['id' => $p['id'], 'name' => $p['name'], 'brand' => $p['brand'], 'qty' => $q, 'price' => (float)$price];
        }
        return $lines;
    });
    if (isset($lines['error'])) fail($lines['error'], 409);

    $total = array_sum(array_map(fn($l) => $l['qty'] * $l['price'], $lines));
    $ref = 'AX-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
    $res = [
        'id' => uid('r_'), 'reference' => $ref, 'status' => 'nouvelle', 'created_at' => now(), 'updated_at' => now(),
        'customer' => ['first_name' => $first, 'last_name' => $last, 'phone' => $phone, 'email' => $email],
        'note' => $note, 'items' => $lines, 'total' => round($total, 2), 'stock_applied' => true,
    ];
    update_json('reservations', function (array &$all) use ($res) { array_unshift($all, $res); });

    $txt = "Nouvelle réservation $ref (retrait au comptoir)\n\n"
         . "Client : $first $last\nTéléphone : $phone\nE-mail : $email\n\n";
    foreach ($lines as $l) $txt .= "- {$l['qty']} × {$l['name']} : " . number_format($l['qty'] * $l['price'], 2, ',', ' ') . " €\n";
    $txt .= "\nTotal : " . number_format($total, 2, ',', ' ') . " €\n" . ($note ? "\nMessage : $note\n" : '');
    send_mail($CONFIG['notify_email'], "Réservation $ref", $txt, $email);
    send_mail($email, "Votre réservation $ref chez Axe Info",
        "Bonjour $first,\n\nNous avons bien reçu votre réservation $ref. Nous vous prévenons dès qu'elle est prête.\n"
        . "Elle est gardée {$CONFIG['hold_days']} jours au magasin. Le paiement se fait au comptoir lors du retrait.\n\n"
        . strstr($txt, "- ") . "\nAxe Info\n14 rue Compagnie Roger Barbe, 22300 Lannion\n02 96 15 05 38\nDu mardi au samedi, 10h-13h et 14h-18h30\n");
    out(['ok' => true, 'reference' => $ref]);

case 'contact':
    $d = body();
    if (!empty($d['website'])) out(['ok' => true]);
    $msg = [
        'id' => uid('m_'), 'created_at' => now(), 'read' => false,
        'name' => str($d['name'] ?? '', 100), 'email' => str($d['email'] ?? '', 120), 'phone' => str($d['phone'] ?? '', 30),
        'subject' => str($d['subject'] ?? '', 80), 'message' => str($d['message'] ?? '', 4000),
    ];
    if (!$msg['name'] || !filter_var($msg['email'], FILTER_VALIDATE_EMAIL) || !$msg['message']) fail('Champs manquants');
    update_json('messages', function (array &$all) use ($msg) { array_unshift($all, $msg); $all = array_slice($all, 0, 500); });
    send_mail($CONFIG['notify_email'], "Demande de devis : {$msg['subject']}",
        "De : {$msg['name']}\nE-mail : {$msg['email']}\nTéléphone : {$msg['phone']}\nSujet : {$msg['subject']}\n\n{$msg['message']}\n", $msg['email']);
    out(['ok' => true]);

/* ===== Backoffice ===== */
case 'login':
    $d = body();
    $userOk = hash_equals((string)($CONFIG['admin_user'] ?? ''), (string)($d['user'] ?? ''));
    $passOk = hash_equals((string)$CONFIG['admin_password'], (string)($d['password'] ?? ''));
    if (!$userOk || !$passOk) { sleep(1); fail('Identifiant ou mot de passe incorrect', 401); }
    session_regenerate_id(true);
    $_SESSION['admin'] = true;
    out(['ok' => true]);

case 'logout':
    body();
    $_SESSION = [];
    session_destroy();
    out(['ok' => true]);

case 'me':
    out(['ok' => true, 'admin' => !empty($_SESSION['admin'])]);

case 'admin_products':
    require_admin();
    out(['ok' => true, 'products' => read_json('catalogue')]);

case 'save_product':
    require_admin();
    $d = body();
    $id = str($d['id'] ?? '', 40);
    $saved = update_json('catalogue', function (array &$cat) use ($d, $id) {
        if ($id) {
            foreach ($cat as &$p) if ($p['id'] === $id) { $p = sanitize_product($d, $p); return $p; }
            return null;
        }
        $p = sanitize_product($d);
        array_unshift($cat, $p);
        return $p;
    });
    if (!$saved) fail('Produit introuvable', 404);
    out(['ok' => true, 'product' => $saved]);

case 'delete_product':
    require_admin();
    $id = str(body()['id'] ?? '', 40);
    update_json('catalogue', function (array &$cat) use ($id) { $cat = array_values(array_filter($cat, fn($p) => $p['id'] !== $id)); });
    out(['ok' => true]);

case 'upload_image':
    require_admin();
    $d = body();
    if (!preg_match('#^data:image/(jpeg|png|webp);base64,(.+)$#', (string)($d['data'] ?? ''), $m)) fail('Image invalide (JPEG, PNG ou WebP)');
    $bin = base64_decode($m[2], true);
    if ($bin === false || strlen($bin) > 8 * 1024 * 1024) fail('Image trop lourde (8 Mo max)');
    $info = @getimagesizefromstring($bin);
    if (!$info || !in_array($info['mime'], ['image/jpeg', 'image/png', 'image/webp'], true)) fail('Fichier non reconnu comme image');
    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
    $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$info['mime']];
    $name = date('Ymd') . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
    file_put_contents(UPLOAD_DIR . '/' . $name, $bin);
    out(['ok' => true, 'url' => UPLOAD_URL . $name]);

case 'reservations':
    require_admin();
    out(['ok' => true, 'reservations' => read_json('reservations')]);

case 'reservation_status':
    require_admin();
    $d = body();
    $id = str($d['id'] ?? '', 40);
    $status = str($d['status'] ?? '', 20);
    if (!in_array($status, ['nouvelle', 'prete', 'retiree', 'annulee'], true)) fail('Statut invalide');
    $res = update_json('reservations', function (array &$all) use ($id, $status) {
        foreach ($all as &$r) if ($r['id'] === $id) { $prev = $r; $r['status'] = $status; $r['updated_at'] = now(); return ['prev' => $prev, 'cur' => $r]; }
        return null;
    });
    if (!$res) fail('Réservation introuvable', 404);
    // Annulation : on remet les articles en stock. Réactivation : on les retire à nouveau.
    $wasApplied = $res['prev']['stock_applied'] ?? true;
    $mustApply = $status !== 'annulee';
    if ($wasApplied !== $mustApply) {
        $sign = $mustApply ? -1 : 1;
        update_json('catalogue', function (array &$cat) use ($res, $sign) {
            foreach ($res['cur']['items'] as $l) foreach ($cat as &$p) if ($p['id'] === $l['id']) $p['stock'] = max(0, $p['stock'] + $sign * $l['qty']);
        });
        update_json('reservations', function (array &$all) use ($id, $mustApply) {
            foreach ($all as &$r) if ($r['id'] === $id) $r['stock_applied'] = $mustApply;
        });
    }
    if ($status === 'prete') {
        $c = $res['cur']['customer'];
        send_mail($c['email'], "Votre réservation {$res['cur']['reference']} est prête",
            "Bonjour {$c['first_name']},\n\nVotre réservation {$res['cur']['reference']} est prête ! Vous pouvez venir la retirer et la régler au comptoir.\n\n"
            . "Axe Info, 14 rue Compagnie Roger Barbe, 22300 Lannion\nDu mardi au samedi, 10h-13h et 14h-18h30\n02 96 15 05 38\n");
    }
    out(['ok' => true]);

case 'messages':
    require_admin();
    out(['ok' => true, 'messages' => read_json('messages')]);

case 'message_read':
    require_admin();
    $id = str(body()['id'] ?? '', 40);
    update_json('messages', function (array &$all) use ($id) { foreach ($all as &$m) if ($m['id'] === $id) $m['read'] = true; });
    out(['ok' => true]);

default:
    fail('Action inconnue', 404);
}
