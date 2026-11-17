# Axe Info · site web

Site du magasin Axe Info (Lannion) : vitrine, boutique en **retrait au comptoir** (aucun paiement en ligne), page Pro & location de sono, et backoffice pour gérer le catalogue.

- Site : pages HTML/CSS/JS statiques (`index.html`, `boutique.html`, `pro.html`)
- API : `api.php` (PHP 7.4+), données stockées en JSON dans `data/` (protégé par `.htaccess`)
- Backoffice : `/admin/` (catalogue, réservations, demandes de devis)

## Installation sur l'hébergement

1. Déployer le dépôt dans `public_html`.
2. Copier `config.example.php` en `config.php` et y mettre l'identifiant, le mot de passe et les adresses e-mail.
   `config.php` n'est **jamais** versionné.
3. Au premier appel, le catalogue est créé à partir de `data/catalogue.seed.json`.
   Les fichiers `data/*.json` et `uploads/` sont les données vivantes du site : ils ne sont pas dans le dépôt et ne sont pas écrasés par un déploiement.

## Tester en local (sans PHP)

```bash
cp config.example.php config.php   # puis choisir un identifiant et un mot de passe
python3 tools/dev_server.py        # http://localhost:8080 et http://localhost:8080/admin/
```

`tools/dev_server.py` reproduit `api.php` en Python, uniquement pour les tests locaux.
