# Déploiement & mise à jour en production

Guide pour héberger **MawCraft multijoueur** sur ton VPS
**Ubuntu 22.04 + nginx**, sur `mawcraft.mawena.cloud`.

> Jusqu'ici tu ne servais qu'un fichier HTML statique. Le multijoueur ajoute
> **un petit serveur Node.js** (dossier [`server/`](../server/)) que nginx expose
> derrière l'adresse `wss://mawcraft.mawena.cloud/ws`.

---

## 1. Comment ça s'articule

```
Navigateur ──HTTPS──►  nginx  ──► sert index.html (fichier statique)
                          │
                          └──/ws──► 127.0.0.1:8080  (serveur Node.js "server.js")
                                        │
                                        └── server/data/world-<seed>.json  (blocs sauvegardés)
```

- Le **terrain** n'est jamais transmis : il est recalculé côté client depuis la seed.
- Le serveur ne transporte que les **positions** et les **blocs modifiés**, et
  sauvegarde ces derniers dans `server/data/`.
- Le serveur écoute uniquement sur `127.0.0.1:8080` (jamais exposé directement) :
  c'est **nginx** qui relaie le WebSocket en `wss://` via le chemin `/ws`.

---

## 2. Première installation

### 2.1 Récupérer les fichiers sur le serveur

Place le projet dans un dossier servi par nginx. On prend ici `/var/www/html/Mawena/MawCraft`
(adapte si ton `root` nginx pointe ailleurs).

```bash
sudo mkdir -p /var/www/html/Mawena/MawCraft
# Copie index.html + le dossier server/ dedans (scp, git clone, rsync… au choix).
# Exemple avec rsync depuis ta machine :
#   rsync -av --exclude server/node_modules --exclude server/data ./ user@mawena.cloud:/var/www/html/Mawena/MawCraft/
```

Arborescence attendue sur le serveur :

```
/var/www/html/Mawena/MawCraft/
├── index.html
└── server/
    ├── server.js
    └── package.json
```

### 2.2 Installer Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # doit afficher v20.x

# pnpm via corepack (fourni avec Node 20)
sudo corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

### 2.3 Installer les dépendances du serveur

```bash
cd /var/www/html/Mawena/MawCraft/server
pnpm install --prod              # installe 'ws' uniquement
sudo mkdir -p data               # dossier des mondes sauvegardés
# Donne la main à l'utilisateur qui fera tourner le service (voir 2.4)
sudo chown -R www-data:www-data /var/www/html/Mawena/MawCraft/server
```

### 2.4 Lancer le serveur en service (systemd)

Crée le fichier `/etc/systemd/system/mawcraft.service` :

```ini
[Unit]
Description=Serveur multijoueur MawCraft
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/html/Mawena/MawCraft/server
ExecStart=/usr/bin/node server.js
Environment=PORT=8080
Environment=HOST=127.0.0.1
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Active et démarre :

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mawcraft
sudo systemctl status mawcraft        # doit être "active (running)"
```

Vérifie les logs :

```bash
journalctl -u mawcraft -f
# → "Serveur MawCraft en écoute sur ws://127.0.0.1:8080"
```

### 2.5 Configurer nginx (relais WebSocket)

**a)** Ajoute ce bloc **une seule fois**, dans la section `http { … }` (par exemple
dans `/etc/nginx/nginx.conf`). Il gère l'en-tête de bascule WebSocket :

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

**b)** Dans le `server { … }` de `mawcraft.mawena.cloud` (ton vhost, souvent dans
`/etc/nginx/sites-available/`), sers le statique **et** relaie `/ws` :

```nginx
server {
    listen 443 ssl http2;
    server_name mawcraft.mawena.cloud;

    # ... tes directives ssl_certificate existantes (Certbot) ...

    root /var/www/html/Mawena/MawCraft;
    index index.html;

    # Le jeu (fichier statique)
    location / {
        try_files $uri $uri/ =404;
    }

    # Le WebSocket multijoueur -> serveur Node local
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 600s;   # garde la connexion ouverte
    }
}
```

**c)** Teste et recharge :

```bash
sudo nginx -t          # "syntax is ok / test is successful"
sudo systemctl reload nginx
```

> HTTPS obligatoire : une page en `https://` ne peut se connecter qu'en `wss://`.
> Si le site est déjà en HTTPS (Certbot), il n'y a rien de plus à faire.

### 2.6 Vérifier que tout marche

- Ouvre `https://mawcraft.mawena.cloud/?seed=1` dans **deux navigateurs** (ou deux
  onglets/pseudos), entre un pseudo, clique **Jouer**.
- En haut à gauche, la ligne `Joueurs :` doit passer à `2`.
- Casse/pose un bloc dans l'un : il apparaît **immédiatement** dans l'autre.
- Recharge la page : tes constructions sont **toujours là** (persistance OK).

En cas de doute, regarde la console du navigateur (F12) : le statut réseau
s'affiche aussi sous le bouton Jouer (« En ligne — N joueur(s) »).

---

## 3. Mettre à jour la prod

### Cas A — tu n'as changé que le jeu (`index.html`)

Le jeu est un simple fichier statique : **aucun redémarrage nécessaire**.

```bash
# Copie le nouveau index.html vers /var/www/html/Mawena/MawCraft/index.html
rsync -av ./index.html user@mawena.cloud:/var/www/html/Mawena/MawCraft/index.html
```

Les joueurs voient la nouvelle version en **rechargeant la page** (Ctrl+F5 pour
forcer le cache si besoin).

### Cas B — tu as changé le serveur (`server/…`)

```bash
# 1) Copier les nouveaux fichiers (sans écraser node_modules ni data)
rsync -av --exclude server/node_modules --exclude server/data \
      ./ user@mawena.cloud:/var/www/html/Mawena/MawCraft/

# 2) Sur le serveur : mettre à jour les dépendances si package.json a changé
cd /var/www/html/Mawena/MawCraft/server
pnpm install --prod

# 3) Redémarrer le service (sauvegarde automatique des mondes à l'arrêt)
sudo systemctl restart mawcraft
sudo systemctl status mawcraft
```

> Le redémarrage déconnecte brièvement les joueurs ; le client se **reconnecte
> tout seul** au bout de ~3 s et recharge les blocs. Les mondes sont sauvegardés
> avant l'arrêt, rien n'est perdu.

### Cas C — tu as changé la config nginx

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Astuce : script de mise à jour

Pour aller vite, un petit script sur le serveur :

```bash
#!/usr/bin/env bash
# /var/www/html/Mawena/MawCraft/update.sh
set -e
cd /var/www/html/Mawena/MawCraft/server
pnpm install --prod
systemctl restart mawcraft
echo "MawCraft mis à jour ✓"
```

---

## 4. Sauvegardes & maintenance

- **Les mondes** vivent dans `/var/www/html/Mawena/MawCraft/server/data/world-<seed>.json`.
  Sauvegarde ce dossier (cron + `tar`/`rsync`) pour ne rien perdre.
- **Voir les mondes existants** : `ls -lh /var/www/html/Mawena/MawCraft/server/data/`
- **Repartir de zéro sur un monde** : arrête le service, supprime le fichier
  `world-<seed>.json` correspondant, redémarre.
- **Le pare-feu** n'a besoin d'ouvrir que **80/443**. Le port 8080 reste en
  local (`127.0.0.1`), inaccessible de l'extérieur — c'est voulu.

---

## 5. Dépannage

| Symptôme | Piste |
| --- | --- |
| « Serveur injoignable (mode solo) » sous le bouton Jouer | Le service tourne ? `systemctl status mawcraft`. Le bloc `location /ws` est-il en place ? `nginx -t && systemctl reload nginx`. |
| `502 Bad Gateway` sur `/ws` | Le serveur Node n'écoute pas sur 8080. `journalctl -u mawcraft -e`. |
| Connexion qui se coupe après ~1 min | Vérifie `proxy_read_timeout` dans le `location /ws`. |
| Les blocs ne se sauvegardent pas | Droits d'écriture sur `server/data/` : `chown -R www-data:www-data`. |
| Mixed content / refus de connexion | La page doit être en **HTTPS** et viser **wss://** (c'est automatique dans le client). |
| `node: command not found` dans systemd | Mets le chemin absolu dans `ExecStart` (`which node`). |

---

## 6. Aller plus loin (Phase 2)

Quand tu voudras ouvrir au public : passage du stockage JSON à **SQLite**, page
d'accueil pour créer/lister des mondes, limites anti-abus et plusieurs mondes
actifs. À faire seulement le moment venu — l'architecture actuelle est prête à
évoluer sans tout refaire.
