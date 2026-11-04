# ⛏ MawCraft

Un mini-Minecraft jouable dans le navigateur, sur ordinateur comme sur écran
tactile : un monde voxel infini généré par _seed_, écrit en **JavaScript vanilla**
avec [Three.js](https://threejs.org/). Tout le jeu tient dans un seul fichier
[`index.html`](index.html), sans compilation ni dépendance à installer. Un petit
serveur WebSocket optionnel ([`server/`](server/)) ajoute le multijoueur.

## ✨ Fonctionnalités

- **Monde infini** généré à la volée par bruit seedé (continents, collines, plages, mer).
- **Streaming de chunks** autour du joueur (chargement/déchargement dynamique) pour rester fluide.
- **7 types de blocs** : Herbe, Terre, Pierre, Sable, Bois, Feuilles, Planches.
- **Arbres** générés procéduralement, avec feuillages qui débordent proprement entre chunks.
- **Eau** non solide avec maillage séparé, natation, et teinte bleutée en immersion.
- **Casser / poser** des blocs, avec remplissage d'eau réaliste sous le niveau de la mer.
- **Atlas de textures pixel-art** généré par code (rien à télécharger).
- **Physique** simple : gravité, saut, collisions, sprint.
- **HUD de debug** (position, chunk, bloc sélectionné) et barre de blocs (hotbar).
- **Commandes tactiles** sur mobile et tablette : joystick, zone de visée, boutons
  sauter / casser / poser / pause.
- **Multijoueur** : même seed = même monde partagé. On se voit bouger en temps réel
  (avatar + pseudo), les blocs cassés/posés sont synchronisés et **sauvegardés** entre
  les sessions. Sans serveur, le jeu bascule en mode solo.

## 🛠 Stack technique

- **Client** : JavaScript vanilla (modules ES), [Three.js](https://threejs.org/) `0.160.0`
  chargé par _import map_ depuis le CDN unpkg, aucune étape de build.
- **Terrain** : génération par bruit seedé maison.
- **Serveur multijoueur** : Node.js (≥ 18) avec la bibliothèque [`ws`](https://github.com/websockets/ws),
  dépendances gérées avec pnpm.

## 📋 Prérequis

- Un navigateur moderne (modules ES et WebGL).
- Python 3 (ou n'importe quel serveur HTTP statique) pour servir le jeu en local.
- Une connexion Internet au premier chargement (Three.js vient du CDN unpkg).
- Pour le multijoueur uniquement : Node.js 18 ou plus récent et pnpm.

## 🚀 Lancer le jeu

Comme le jeu utilise des modules ES et un _import map_, ouvrez-le via un
serveur HTTP local (un simple double-clic sur le fichier ne suffit pas) :

```bash
# Depuis la racine du projet
python3 -m http.server 8000
# puis ouvrez http://localhost:8000/ dans le navigateur
```

Entrez un pseudo (facultatif, « Joueur » par défaut), puis cliquez sur **Jouer** ou
appuyez sur `Entrée`. Sur ordinateur, le curseur est alors verrouillé ; sur un
écran tactile, les commandes tactiles s'affichent. Le pseudo est mémorisé dans le
navigateur (`localStorage`).

Sans serveur multijoueur, le jeu affiche « Serveur injoignable (mode solo) » et
reste entièrement jouable.

## 🌍 Jouer à plusieurs (multijoueur)

Lancez le serveur WebSocket du dossier [`server/`](server/) :

```bash
cd server
pnpm install    # installe 'ws'
pnpm start      # écoute sur ws://127.0.0.1:8080
```

Ouvrez ensuite le jeu (servi par le serveur HTTP local), entrez un pseudo, cliquez
**Jouer**. Toute personne ouvrant la **même seed** rejoint le même monde, s'y voit,
et partage les blocs, qui sont sauvegardés dans `server/data/world-<seed>.json`.

Le client choisit l'adresse du serveur tout seul :

- page servie en HTTP (local) : `ws://<hôte de la page>:8080` ;
- page servie en HTTPS (production) : `wss://<domaine>/ws`, relayé par nginx.

## ⚙️ Configuration

Le serveur multijoueur lit deux variables d'environnement facultatives :

| Variable | Rôle |
| -------- | ---- |
| `PORT`   | Port d'écoute du serveur WebSocket (8080 par défaut). |
| `HOST`   | Adresse d'écoute (`127.0.0.1` par défaut : derrière nginx, localhost uniquement). |

Le client n'a rien à configurer.

## 🎮 Commandes

### Clavier et souris

| Touche / Action    | Effet                          |
| ------------------ | ------------------------------ |
| `ZQSD` / `WASD`    | Se déplacer                    |
| `Espace`           | Sauter / nager                 |
| `Shift`            | Sprinter                       |
| Clic gauche        | Casser un bloc                 |
| Clic droit         | Poser un bloc                  |
| `1`–`7` ou molette | Choisir un bloc dans la barre  |
| `Échap`            | Pause / libérer le curseur     |

### Écran tactile

Les commandes tactiles s'activent automatiquement sur les appareils à pointeur
tactile.

| Élément               | Effet                        |
| --------------------- | ---------------------------- |
| Joystick (à gauche)   | Se déplacer                  |
| Zone de droite        | Regarder autour de soi       |
| Bouton `⭡`            | Sauter / nager               |
| Bouton `⛏`            | Casser un bloc               |
| Bouton `▣`            | Poser un bloc                |
| Bouton `☰`            | Pause                        |

## 🌱 Rejouer le même monde

Le monde est déterministe : ajoutez `?seed=12345` à l'URL pour régénérer
exactement le même terrain. Sans paramètre, une seed aléatoire est choisie et
inscrite dans l'URL : il suffit de partager ce lien pour jouer dans le même monde.

```
http://localhost:8000/?seed=12345
```

## 📁 Structure du projet

```
MawCraft/
├── index.html          # Le jeu complet (Three.js, un seul fichier)
├── server/             # Serveur multijoueur Node.js (WebSocket)
│   ├── server.js
│   ├── package.json
│   └── pnpm-lock.yaml
├── docs/
│   └── DEPLOIEMENT.md  # Guide de déploiement/mise à jour (Ubuntu + nginx)
├── reverse-shell-lab/  # Labo de sécurité pédagogique isolé (voir son README)
├── README.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```

Le dossier [`reverse-shell-lab/`](reverse-shell-lab/) est un exercice de sécurité
défensive **indépendant du jeu** : un banc d'essai Docker entièrement isolé pour
comprendre et détecter un reverse shell. Voir [son README](reverse-shell-lab/README.md).

## 🧪 Tests

Le dépôt ne contient pas de tests automatisés. Pour vérifier une modification,
servez le dossier en local et jouez avec une seed fixe (`?seed=12345`).

## 📦 Déploiement

Le guide [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) décrit l'installation en
production (Ubuntu, Node.js 20 LTS, service systemd pour le serveur, nginx pour
servir `index.html` et relayer `/ws` vers le serveur WebSocket), les mises à jour,
les sauvegardes des mondes et le dépannage.

## 🤝 Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 Licence

Aucune licence n'est déclarée dans ce dépôt. Projet réalisé par **mawena**.
