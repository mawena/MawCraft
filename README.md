# ⛏ MawCraft

Un mini-Minecraft jouable dans le navigateur : un monde voxel infini généré
par _seed_, écrit en **JavaScript vanilla** avec [Three.js](https://threejs.org/).
Tout le jeu tient dans un seul fichier [`index.html`](index.html) — aucune
compilation, aucune dépendance à installer.

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

## 🚀 Lancer le jeu

Comme le jeu utilise des modules ES et un _import map_, ouvrez-le via un
serveur HTTP local (un simple double-clic sur le fichier ne suffit pas) :

```bash
# Depuis la racine du projet
python3 -m http.server 8000
# puis ouvrez http://localhost:8000/ dans le navigateur
```

> Three.js est chargé depuis le CDN unpkg — une connexion Internet est nécessaire
> au premier chargement.

## 🎮 Commandes

| Touche / Action    | Effet                          |
| ------------------ | ------------------------------ |
| `ZQSD` / `WASD`    | Se déplacer                    |
| `Espace`           | Sauter / nager                 |
| `Shift`            | Sprinter                       |
| Clic gauche        | Casser un bloc                 |
| Clic droit         | Poser un bloc                  |
| `1`–`7` ou molette | Choisir un bloc dans la barre  |
| `Échap`            | Pause / libérer le curseur     |

Cliquez sur l'écran pour verrouiller le curseur et commencer à jouer.

## 🌱 Rejouer le même monde

Le monde est déterministe : ajoutez `?seed=12345` à l'URL pour régénérer
exactement le même terrain. Sans paramètre, une seed aléatoire est choisie à
chaque partie.

```
http://localhost:8000/?seed=12345
```

## 📁 Structure du projet

```
MawCraft/
├── index.html          # Le jeu complet (Three.js, un seul fichier)
├── reverse-shell-lab/  # Labo de sécurité pédagogique isolé (voir son README)
├── README.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```

Le dossier [`reverse-shell-lab/`](reverse-shell-lab/) est un exercice de sécurité
défensive **indépendant du jeu** : un banc d'essai Docker entièrement isolé pour
comprendre et détecter un reverse shell. Voir [son README](reverse-shell-lab/README.md).

## 🛠 Stack technique

- [Three.js](https://threejs.org/) `0.160.0` (via import map / CDN unpkg)
- JavaScript vanilla (modules ES), aucune étape de build
- Génération de terrain par bruit seedé maison

## 🤝 Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 Licence

Projet réalisé par **mawena**. Ajoutez un fichier `LICENSE` pour définir les
conditions de réutilisation.
