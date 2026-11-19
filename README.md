# TaskFlow — Gestion collaborative de projets

Application web de gestion collaborative développée avec Django REST Framework et React/Vite. Elle propose une authentification par token, trois rôles (Admin, Manager, Member), la gestion des projets, tâches et commentaires, un workflow contrôlé, un tableau de bord et un journal d'audit.

## Prérequis

- Python 3.12 recommandé
- Node.js 20 ou supérieur
- npm
- Docker Desktop (optionnel, pour Docker Compose)

## Installation locale — Windows PowerShell

### 1. Backend

À exécuter depuis la racine du projet :

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Ouvrir `.env` et remplacer `DJANGO_SECRET_KEY` par une clé secrète personnelle. Ne jamais publier ce fichier.
Charger les variables d'environnement dans la session PowerShell actuelle :

```powershell
Get-Content .env | Where-Object {
    $_.Trim() -and -not $_.Trim().StartsWith('#') -and $_.Contains('=')
} | ForEach-Object {
    $name, $value = $_ -split '=', 2
    [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process')
}
```

Cette étape doit être exécutée dans le même terminal PowerShell que les commandes Django.

Puis exécuter :

```powershell
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 8007
```

- API : http://127.0.0.1:8007/api/
- Administration Django : http://127.0.0.1:8007/admin/

### 2. Frontend

Ouvrir un deuxième terminal :

```powershell
cd frontend
npm install
```

Créer `frontend/.env` avec :

```env
VITE_API_URL=http://127.0.0.1:8007/api
```

Puis lancer :

```powershell
npm run dev
```

Interface : http://localhost:5173/

## Comptes de démonstration

La commande `python manage.py seed_demo` crée trois comptes locaux : `admin`, `manager` et `member`.

Lors de leur première création, des mots de passe aléatoires sont générés et affichés dans le terminal. Copiez-les immédiatement et conservez-les de manière sécurisée.

Si les comptes existent déjà, leurs mots de passe ne sont pas modifiés.

Ces comptes sont réservés à la démonstration locale. Ne pas utiliser cette commande ni ces comptes sur un serveur public ou en production.

## Fonctionnalités

- Authentification, déconnexion et gestion de trois rôles.
- Gestion CRUD des projets, tâches et commentaires.
- Gestion des comptes selon les permissions.
- Affectation des tâches, échéances et priorités.
- Recherche et filtres.
- Workflow avec transitions de statut contrôlées par l'API.
- Tableau de bord avec indicateurs.
- Journal d'audit des opérations sensibles.
- Interface responsive en français.

## Tests et qualité

Commandes principales :

```powershell
python manage.py check
pytest -v
coverage run -m pytest
coverage report -m
ruff check config tasks
bandit -r config tasks
pip-audit
```

Les rapports de validation disponibles sont dans `reports/`.

Résultats enregistrés lors de la validation du projet :

- Tests automatisés : 48 réussis.
- Couverture globale : 88 %.
- Tests multi-navigateurs : 4 réussis (Chromium et Firefox).
- Test de charge : 20 utilisateurs, 0 échec, temps de réponse moyen de 20 ms.
- pip-audit : 73 dépendances examinées, 0 vulnérabilité signalée lors de cette exécution.
- ZAP : des alertes restent présentes, notamment une alerte CSRF de confiance faible et une divulgation d'information sur l'en-tête Server.

Ces résultats correspondent à l'environnement et à la date de validation concernés. Ils ne constituent pas une garantie de sécurité ou de conformité absolue. Consulter les rapports détaillés avant toute conclusion.

Documents :

- `docs/MATRICE_TRACABILITE.md`
- `docs/RAPPORT_CONFORMITE_ISO25010.md`

## Docker Compose

Créer le fichier `.env` à partir du modèle :

```powershell
Copy-Item .env.example .env
```

Modifier `DJANGO_SECRET_KEY` dans `.env`, puis lancer depuis la racine :

```powershell
docker compose up --build
```

- Backend : http://localhost:8007
- Frontend : http://localhost:5173

Arrêter les services avec `Ctrl+C`, puis :

```powershell
docker compose down
```

Le serveur Django `runserver` utilisé dans cette configuration est destiné au développement et à la démonstration, pas à un déploiement de production.

## Endpoints principaux

- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`
- CRUD `/api/projects/`
- CRUD `/api/tasks/`
- CRUD `/api/comments/`
- Administration `/api/users/`
- Journal `/api/audit/`
- `GET /api/dashboard/`
- `POST /api/tasks/{id}/transition/`

Les routes métier nécessitent une authentification par token :

`Authorization: Token <token>`

## Sécurité et configuration

- Ne jamais committer `.env`, les bases de données locales ou les clés secrètes.
- Utiliser des mots de passe personnels et robustes.
- Configurer HTTPS, les cookies sécurisés et les paramètres de production avant un déploiement public.
- Les comptes de démonstration sont réservés à un environnement local.
