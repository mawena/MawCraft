# Contribuer à MawCraft

Merci de votre intérêt pour MawCraft ! Ce guide décrit comment proposer des
améliorations au projet.

## Prérequis

- Un navigateur moderne (support des modules ES et de WebGL).
- [Python 3](https://www.python.org/) ou tout autre serveur HTTP statique pour
  servir le jeu en local.
- Une connexion Internet au premier chargement (Three.js vient du CDN unpkg).

## Développement en local

Le jeu tient dans un seul fichier [`index.html`](index.html) — il n'y a **aucune
étape de build**. Il suffit de servir le dossier :

```bash
python3 -m http.server 8000
# puis http://localhost:8000/
```

Modifiez `index.html`, rafraîchissez la page, c'est tout.

Astuce : utilisez `?seed=12345` dans l'URL pour tester toujours sur le même
monde pendant que vous itérez.

## Style de code

- JavaScript vanilla, modules ES, pas de dépendance ajoutée sans discussion.
- Conservez les **commentaires en français** et le ton du code existant.
- Gardez les sections balisées (`// ---------- ... ----------`) cohérentes.
- Préférez des noms explicites et une logique lisible aux micro-optimisations.

## Proposer une modification

1. Créez une branche à partir de `main`.
2. Faites des commits clairs et atomiques.
3. Vérifiez manuellement que le jeu se lance et que la fonctionnalité marche
   (déplacement, casser/poser, streaming des chunks, eau).
4. Mettez à jour le [CHANGELOG.md](CHANGELOG.md) sous la section **[Non publié]**.
5. Ouvrez une Pull Request décrivant le *quoi* et le *pourquoi*.

## Signaler un bug

Ouvrez une issue en précisant :

- le comportement attendu vs observé ;
- la seed utilisée (`?seed=...`) si le bug dépend du monde ;
- le navigateur et sa version ;
- les erreurs éventuelles de la console.

## Le dossier `reverse-shell-lab/`

Ce sous-dossier est un exercice de **sécurité défensive** entièrement isolé,
indépendant du jeu. Toute contribution le concernant doit rester dans ce cadre
pédagogique et légitime (voir son [README](reverse-shell-lab/README.md)).
