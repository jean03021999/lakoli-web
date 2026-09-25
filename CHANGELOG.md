# Journal des modifications — LAKOLI (frontend React)

Historique des évolutions de l'interface, de la plus récente à la plus ancienne.
API correspondante : dépôt `lakoli` (voir son CHANGELOG).

## 2026-09-25

### Élèves
- Impression de la liste des élèves : une page par classe (nom de la classe en grand, effectif, zone de signature), ou la seule classe filtrée.
- Les filtres de classe et de statut de paiement s'appliquent à l'impression ; colonne « Statut » ajoutée quand un filtre de paiement est actif.
- Nouveau filtre « Pas encore à jour » (tous les élèves sauf « À jour »).
- Barre d'outils réorganisée : recherche et actions (import, ajout) à gauche, filtres et impression à droite.

### Frais de scolarité
- Un montant supérieur à l'échéance est reporté sur les tranches suivantes, plafonné au reste total de la scolarité (indiqué sous le champ).
- Le reçu détaille une ligne par tranche payée, avec le reste à payer.
- Si l'inscription réussit mais que le paiement de scolarité échoue, le reçu d'inscription reste imprimable et l'erreur est signalée à part.

### Impression
- Vrai QR code (généré localement, paquet `qrcode`) sur le reçu de paiement et sur la fiche de paie : référence, élève/enseignant, montant, date, statut.

## 2026-09-24
- Module Salaires : liste, formulaire, fiche de paie imprimable.
- Reçu : situation globale de l'élève avec reste à payer par trimestre.

## 2026-09-22
- Inscription / réinscription et paiement en un seul geste, avec un reçu combiné.
- Montant d'inscription en saisie libre.

## 2026-09-21
- Inscription / réinscription : flux complet, reçu imprimable, statut de scolarité filtré.

## 2026-09-15
- Nomenclature guinéenne des niveaux ; tableau de bord finances et inscriptions.

## 2026-09-14
- Fiche élève adaptée à l'inscription active (type et statut affichés).

## 2026-09-11
- Tableau de bord connecté à l'API ; rôles Proviseur et Censeur dans le menu.

## 2026-08-31
- Composant `ChampMatiere` réutilisable, corrections diverses.

## 2026-08-21
- Module Notes : liste, saisie, validation par la direction.

## 2026-08-20
- Emploi du temps en tableau avec export ; gestion des classes dans Matières.
- Module Frais de scolarité ; finitions visuelles Élèves et Enseignants.

## 2026-08-18
- Modules Enseignants et Matières.

## 2026-07-31
- Module Élèves complet : liste avec recherche et statuts colorés, fiche détaillée, formulaire d'ajout avec tuteur.
- Tableau de bord : menu latéral, 8 modules, mode sombre.

## 2026-07-09
- Authentification React connectée au backend.
