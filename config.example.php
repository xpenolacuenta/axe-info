<?php
// Configuration du site Axe Info.
// Ce fichier n'est jamais affiché par le serveur (c'est du PHP) : on peut y mettre le mot de passe.

return [
    // Identifiant et mot de passe du backoffice (/admin).
    'admin_user' => 'CHOISISSEZ-UN-IDENTIFIANT',
    'admin_password' => 'CHOISISSEZ-UN-MOT-DE-PASSE',

    // Adresse qui reçoit les réservations et les demandes de devis.
    'notify_email' => 'contact@axe-info.com',

    // Adresse d'expédition des e-mails (doit appartenir à votre domaine chez l'hébergeur).
    'from_email' => 'no-reply@axe-info.fr',

    // Nombre de jours pendant lesquels une réservation est gardée au magasin.
    'hold_days' => 7,
];
