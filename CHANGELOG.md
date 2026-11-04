# Changelog

Toutes les évolutions notables de MawCraft sont documentées ici.

Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et le projet suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [Non publié]

## [1.0.1] - 2026-11-04

### Ajouté

- **Multijoueur (Phase 1)** : une même seed = un monde partagé.
  - Serveur WebSocket Node.js (`server/`) qui relaie les positions et les blocs.
  - On voit les autres joueurs bouger en temps réel (avatar + pseudo).
  - Les blocs cassés/posés sont synchronisés entre les joueurs.
  - **Persistance** des mondes : les modifications sont sauvegardées dans
    `server/data/world-<seed>.json` et rechargées d'une session à l'autre.
  - Champ pseudo + bouton « Jouer », reconnexion automatique, repli en mode solo
    si le serveur est absent.
  - Guide de déploiement/mise à jour `docs/DEPLOIEMENT.md` (Ubuntu 22.04 + nginx).
- **Commandes tactiles** sur les appareils à pointeur tactile : joystick de
  déplacement, zone de visée, boutons sauter / casser / poser / pause.

### Modifié

- README propre au projet : commandes tactiles, variables d'environnement `PORT`
  et `HOST` du serveur, prérequis, tests, déploiement et licence.
- Version du serveur (`server/package.json`) passée à `1.0.1`.

## [1.0.0] - 2026-07-05

### Ajouté

- Monde voxel infini généré par bruit seedé (continents, collines, plages, mer).
- Streaming des chunks autour du joueur avec chargement/déchargement dynamique.
- 7 types de blocs : Herbe, Terre, Pierre, Sable, Bois, Feuilles, Planches.
- Génération procédurale d'arbres, feuillages débordant proprement entre chunks.
- Eau non solide (maillage séparé), natation et teinte bleutée en immersion.
- Casser et poser des blocs, avec remplissage d'eau sous le niveau de la mer.
- Atlas de textures pixel-art généré par code.
- Physique : gravité, saut, collisions, sprint.
- Contrôles ZQSD/WASD, verrouillage du curseur, barre de blocs et molette.
- HUD de debug (position, chunk, bloc sélectionné).
- Rejouabilité déterministe via le paramètre d'URL `?seed=`.
- Labo de sécurité pédagogique isolé `reverse-shell-lab/` (Docker).

[Non publié]: https://github.com/mawena/MawCraft/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/mawena/MawCraft/releases/tag/v1.0.1
[1.0.0]: https://github.com/mawena/MawCraft/tree/4e0a163
