# Rapport d'évaluation qualité — TaskFlow
## Référentiel ISO/IEC 25010

**Date d'évaluation :** 19 novembre 2026
**Projet :** TaskFlow — Gestion collaborative de projets et de tâches
**Périmètre :** Backend Django/DRF, frontend React/TypeScript, base de données et environnement Docker.

---

## 1. Objectif et méthode

L'objectif est d'évaluer la qualité de TaskFlow à partir des huit caractéristiques du modèle ISO/IEC 25010.

L'évaluation s'appuie sur :
- les tests unitaires et d'intégration Pytest ;
- les tests de parcours Playwright ;
- les mesures de charge Locust ;
- les analyses statiques Bandit ;
- l'analyse dynamique OWASP ZAP ;
- la couverture de code ;
- les vérifications Django et Docker.

Les conclusions portent uniquement sur les fonctionnalités et scénarios effectivement testés. Elles ne constituent pas une certification ISO.

## 2. Architecture et périmètre fonctionnel

TaskFlow est une application web composée de :
- un backend Django et Django REST Framework exposant une API REST ;
- un frontend React avec TypeScript et Vite ;
- une base de données relationnelle ;
- une authentification par jeton ;
- un environnement de lancement Docker Compose.

Les principales entités métier sont :
- UserProfile : profil et rôle associé à un utilisateur ;
- Project : projet et membres associés ;
- Task : tâche, priorité, statut, échéance et affectation ;
- Comment : commentaire associé à une tâche ;
- AuditLog : historique des actions réalisées.

Les rôles applicatifs sont Admin, Manager et Member. Les autorisations sont contrôlées côté API.

## 3. Synthèse des résultats

| Caractéristique | Résultat observé | Évaluation |
|---|---|---|
| Aptitude fonctionnelle | 32 tests Pytest réussis | Satisfaisant sur le périmètre testé |
| Performance | 20 utilisateurs, 1127 requêtes, 0 échec, P95 = 36 ms | Satisfaisant dans l'environnement local |
| Compatibilité | 2 tests Chromium et 2 tests Firefox réussis | Satisfaisant sur les parcours testés |
| Utilisabilité | Interface disponible, recette et audit d'accessibilité à compléter | Partiel |
| Fiabilité | 6 contrôles smoke test réussis | Satisfaisant sur les scénarios testés |
| Sécurité | Bandit sans problème détecté ; alertes ZAP à analyser | Partiel |
| Maintenabilité | Couverture de code de 88 % | Bon indicateur, évaluation complémentaire nécessaire |
| Portabilité | Docker Compose fonctionne dans l'environnement actuel | Partiel |

## 4. Évaluation détaillée

### 4.1 Aptitude fonctionnelle

**Exigence :** l'application doit fournir les fonctions de gestion des utilisateurs, projets, tâches, commentaires, workflow, tableau de bord et audit.

**Vérifications :**
- tests de validation des titres et priorités ;
- tests des permissions selon les rôles ;
- tests CRUD des tâches, projets, commentaires et utilisateurs ;
- tests de transition du workflow ;
- tests des filtres du tableau de bord ;
- test de création d'une entrée d'audit après suppression.

**Résultat :** 32 tests Pytest exécutés, sans échec, erreur ou test ignoré.

**Conclusion :** les fonctionnalités couvertes par les tests sont validées. Les tests ne prouvent pas à eux seuls l'absence de défaut sur tous les scénarios possibles.

**Preuve :** `reports/pytest_report.xml`.

### 4.2 Efficacité des performances

**Exigence :** les temps de réponse doivent rester inférieurs à la cible de 500 ms dans le scénario de charge défini.

**Procédure :** simulation Locust de 20 utilisateurs concurrents, avec montée en charge de 2 utilisateurs par seconde pendant 120 secondes.

**Résultats :**
- 1127 requêtes ;
- 0 échec ;
- temps moyen : 20 ms ;
- médiane : 18 ms ;
- P95 : 36 ms ;
- P99 : 57 ms ;
- maximum : 120 ms ;
- débit moyen : 9,56 requêtes/seconde.

**Conclusion :** les résultats sont inférieurs à la cible de 500 ms dans cet environnement de test.

**Limite :** il s'agit d'une mesure locale avec le serveur de développement. Elle ne garantit pas les mêmes performances en production.

**Preuve :** `reports/performance_20users_summary.txt`.

### 4.3 Compatibilité

**Exigence :** les parcours essentiels doivent fonctionner sur au moins deux navigateurs.

**Procédure :** tests automatisés Playwright sur Chromium et Firefox.

**Résultats :**
- Chromium : 2 tests réussis sur 2 ;
- Firefox : 2 tests réussis sur 2 ;
- total : 4 tests réussis sur 4.

Les scénarios vérifient l'affichage du formulaire de connexion, l'accessibilité de ses champs et le rejet d'identifiants invalides avec un message.

**Conclusion :** compatibilité validée pour les parcours automatisés présents, sans prétendre couvrir toutes les fonctionnalités et configurations de navigateurs.

**Preuve :** `reports/e2e_compatibility_report.txt` et les tests `frontend/e2e/`.

### 4.4 Utilisabilité

**Exigence :** l'interface doit faciliter la navigation, la compréhension des informations et l'exécution des opérations.

**Éléments disponibles :**
- interface de connexion ;
- tableau de bord avec indicateurs ;
- navigation entre tâches, projets et commentaires ;
- formulaires de création et de modification ;
- filtres et recherche ;
- affichage des fonctions selon le rôle.

**Évaluation complémentaire nécessaire :**
- recette utilisateur documentée ;
- vérification complète de la navigation au clavier ;
- contrôle des contrastes et des libellés accessibles ;
- vérification sur plusieurs tailles d'écran.

**Conclusion :** fonctionnalités d'interface présentes, mais conformité d'accessibilité et satisfaction utilisateur non démontrées par une recette formelle.

### 4.5 Fiabilité

**Exigence :** l'application doit répondre de façon cohérente aux requêtes valides et invalides.

**Procédure :** smoke test de six contrôles :
1. API sans authentification : réponse 401 ;
2. dashboard protégé : réponse 401 ;
3. tâches protégées : réponse 401 ;
4. route inconnue : réponse 404 ;
5. API disponible après requêtes invalides : réponse attendue 401 ;
6. frontend accessible : réponse HTTP 200.

**Résultat :** six contrôles réussis sur six.

**Conclusion :** les scénarios de disponibilité et de gestion des erreurs testés sont satisfaisants.

**Limite :** ce test ne démontre pas la reprise après panne, la restauration de sauvegarde ou la durabilité des données après incident.

**Preuve :** `reports/reliability_smoke_test.txt`.

### 4.6 Sécurité

**Exigence :** l'application doit protéger les ressources et appliquer les permissions selon les rôles.

**Mécanismes présents :**
- authentification par jeton ;
- endpoints protégés ;
- permissions différenciées entre Admin, Manager et Member ;
- journalisation des actions ;
- en-têtes HTTP de sécurité ;
- contrôle des accès aux tâches, projets, utilisateurs et journaux d'audit.

**Analyses réalisées :**

Bandit :
- 766 lignes de code analysées dans le périmètre backend ;
- aucun problème détecté dans le rapport final ;
- une suppression explicite de signalement (`nosec`) est documentée dans le code et doit être justifiée.

OWASP ZAP :
- alerte relative à l'absence de jetons anti-CSRF sur certaines pages ;
- alerte relative à la divulgation de la version du serveur dans l'en-tête Server ;
- informations complémentaires sur les en-têtes et la politique de cache.

Django :
- `manage.py check` : aucune anomalie détectée ;
- `manage.py check --deploy` : avertissements liés à HSTS, à la redirection HTTPS et aux cookies sécurisés.

**Conclusion :** des mécanismes de sécurité et des contrôles automatisés sont présents, mais les alertes ZAP et les avertissements de déploiement doivent être traités avant une mise en production.

**Limite :** le serveur Django de développement ne doit pas être utilisé comme serveur de production.

**Preuves :**
- `reports/bandit_backend_final.txt`
- `reports/zap_final_report.json`
- `reports/reliability_smoke_test.txt`
- résultats des commandes Django `check` et `check --deploy`.

### 4.7 Maintenabilité

**Exigence :** le code doit être organisé, testable et suffisamment couvert par des tests automatisés.

**Éléments présents :**
- séparation entre modèles, permissions, serializers, services et vues ;
- tests unitaires et API ;
- couverture mesurée avec Coverage.

**Résultat de couverture :**
- couverture totale : 88 % ;
- modèles : 94 % ;
- permissions : 92 % ;
- serializers : 88 % ;
- services : 94 % ;
- vues : 82 %.

**Conclusion :** la couverture constitue un indicateur favorable de testabilité. Elle ne mesure pas directement la complexité, la duplication ou la qualité de conception.

**Preuve :** `reports/coverage_report.txt`.

### 4.8 Portabilité

**Exigence :** le système doit pouvoir être lancé de manière reproductible dans un environnement compatible.

**Éléments présents :**
- Dockerfile ;
- Docker Compose ;
- configuration par variables d'environnement ;
- backend et frontend exécutés dans des conteneurs.

**Résultat observé :**
- backend démarré ;
- frontend démarré ;
- vérification Django sans anomalie ;
- frontend accessible avec une réponse HTTP 200.

**Conclusion :** le lancement Docker est fonctionnel dans l'environnement actuel.

**Limite :** une installation sur une machine totalement vierge n'a pas été démontrée dans les preuves disponibles.

## 5. Limites connues et actions recommandées

| Priorité | Point à traiter | Action recommandée |
|---|---|---|
| Haute | Serveur de développement Django | Utiliser un serveur WSGI/ASGI adapté en production |
| Haute | Configuration HTTPS | Configurer TLS, HSTS et cookies sécurisés derrière HTTPS |
| Haute | Alerte ZAP sur l'en-tête Server | Masquer les informations de version au niveau du serveur de production |
| Moyenne | Alerte anti-CSRF ZAP | Vérifier les pages concernées et documenter le périmètre réel de l'API Token |
| Moyenne | Accessibilité | Réaliser une recette clavier, contraste et libellés |
| Moyenne | Portabilité | Refaire l'installation sur une machine ou VM propre |
| Moyenne | Maintenabilité | Compléter l'analyse par complexité et duplication |

## 6. Conclusion générale

Les résultats disponibles montrent que TaskFlow dispose d'une base fonctionnelle testée, d'un workflow métier contrôlé, d'une gestion des rôles, d'un journal d'audit, d'une interface web et d'un environnement Docker opérationnel.

Les tests automatisés, les mesures de performance et les parcours multi-navigateurs apportent des éléments objectifs en faveur de la qualité du logiciel.

Cependant, certaines dimensions restent partiellement évaluées, en particulier l'accessibilité, la sécurité du déploiement de production et la portabilité sur un environnement vierge.

**Conclusion :** le projet présente des éléments de conformité et des preuves de qualité au regard des huit caractéristiques ISO/IEC 25010. Il ne doit pas être présenté comme certifié ISO ni comme totalement conforme sans les vérifications complémentaires indiquées dans ce rapport.

## 7. Liste des preuves

| Fichier | Contenu |
|---|---|
| `reports/pytest_report.xml` | Résultats des tests Pytest |
| `reports/coverage_report.txt` | Couverture de code |
| `reports/performance_20users_summary.txt` | Résultats Locust |
| `reports/e2e_compatibility_report.txt` | Tests Chromium et Firefox |
| `reports/reliability_smoke_test.txt` | Contrôles de fiabilité |
| `reports/bandit_backend_final.txt` | Analyse statique Bandit |
| `reports/zap_final_report.json` | Analyse dynamique OWASP ZAP |
| `reports/pip_audit_report.json` | Analyse des dépendances |
