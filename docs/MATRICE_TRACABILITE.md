# Matrice de traçabilité — TaskFlow

Date d'évaluation : 19/11/2026

## 1. Exigences fonctionnelles

| ID | Exigence | Implémentation | Test / outil | Résultat | Statut |
|---|---|---|---|---|---|
| F-01 | Authentification | Login Token DRF, logout, profil courant | Pytest, Playwright, smoke test | Accès API protégé ; interface de connexion testée | Vérifié partiellement |
| F-02 | Trois profils | admin, manager, member | tests_permissions.py, test_member_cannot_create_task | Permissions différenciées testées | Vérifié |
| F-03 | Entités liées | Project, Task, Comment, UserProfile, AuditLog | tests ORM et API | Relations FK, M2M et OneToOne présentes | Vérifié |
| F-04 | CRUD | Tâches, projets, commentaires, utilisateurs | test_project_crud, test_comment_crud, test_admin_user_crud, tests de tâches | Création, modification et suppression testées | Vérifié |
| F-05 | Workflow | Transitions de statut contrôlées | test_transition_workflow | Transition autorisée acceptée, transition interdite rejetée | Vérifié |
| F-06 | Dashboard | Indicateurs agrégés et filtres | test_dashboard_filters, Locust | Filtrage API et performance mesurés | Vérifié |
| F-07 | Recherche et filtres | Recherche texte, statut, priorité, projet | test_list_and_filter_tasks, test_invalid_status_filter_returns_400 | Filtres testés ; recherche disponible | Vérifié partiellement |
| F-08 | Audit | AuditLog avec acteur, action, entité, détails, IP et date | test_delete_task_and_audit | Création d'une entrée d'audit après suppression testée | Vérifié partiellement |
| F-09 | Règles métier | services, modèles, serializers et permissions | test_services.py, test_permissions.py, test_api.py | Validations et restrictions testées | Vérifié |

## 2. Exigences qualité ISO/IEC 25010

| ID | Caractéristique | Critère / mesure | Outil et résultat | Statut |
|---|---|---|---|---|
| Q-01 | Aptitude fonctionnelle | Fonctionnalités et règles métier testées | Pytest : 32 tests, 0 échec, 0 erreur | Vérifié |
| Q-02 | Performance | Réponse API sous charge, cible P95 < 500 ms | Locust : 20 utilisateurs, 1127 requêtes, 0 échec, P95 global 36 ms | Vérifié dans l'environnement testé |
| Q-03 | Compatibilité | Parcours principaux sur deux navigateurs | Playwright : Chromium 2/2, Firefox 2/2 | Vérifié pour les parcours testés |
| Q-04 | Utilisabilité | Interface, navigation, lisibilité et accessibilité | Inspection de l'interface ; recette et audit d'accessibilité à compléter | Partiel |
| Q-05 | Fiabilité | Réponses cohérentes aux requêtes valides et invalides | Smoke test : 6 contrôles réussis | Vérifié pour les scénarios testés |
| Q-06 | Sécurité | Analyse statique, dépendances, scan dynamique et permissions | Bandit : 0 problème détecté ; ZAP : 2 catégories d'alertes à analyser ; pip-audit à joindre | Partiel |
| Q-07 | Maintenabilité | Couverture, organisation en couches et tests | Coverage : 88 % ; architecture Django en couches | Vérifié partiellement |
| Q-08 | Portabilité | Démarrage reproductible avec Docker Compose | Conteneurs backend/frontend démarrés et frontend HTTP 200 | Vérifié dans l'environnement actuel uniquement |

## 3. Règles métier testées

| ID | Règle | Preuve |
|---|---|---|
| BR-01 | Le titre est une chaîne de 3 à 120 caractères | test_title_is_trimmed, tests de longueur |
| BR-02 | Les priorités acceptées sont low, medium et high | test_calculate_priority_score, test_invalid_priority |
| BR-03 | Les scores de priorité sont 1, 2 et 3 | test_calculate_priority_score |
| BR-04 | Les transitions de statut suivent le workflow défini | test_transition_workflow |
| BR-05 | Un membre ne peut pas créer une tâche | test_member_cannot_create_task |
| BR-06 | Les permissions dépendent du rôle utilisateur | test_manager_permission, test_admin_permission_rejects_manager |
| BR-07 | Les filtres de statut invalides sont rejetés | test_invalid_status_filter_returns_400 |
| BR-08 | Une suppression de tâche génère une entrée d'audit | test_delete_task_and_audit |

## 4. Limites et réserves

- Les mesures de performance proviennent d'un environnement local de test et ne constituent pas une garantie de capacité en production.
- Les tests Chromium et Firefox couvrent les parcours automatisés présents, pas toutes les fonctionnalités ni tous les appareils.
- Le smoke test vérifie les réponses attendues et la disponibilité, mais ne démontre pas à lui seul la reprise après panne ni la durabilité des données.
- Le rapport ZAP contient des alertes qui doivent être analysées et documentées.
- Les avertissements Django liés à HTTPS doivent être traités avant une mise en production HTTPS.
- La portabilité sur une machine totalement vierge reste à démontrer.

## 5. Politique de preuve

Chaque résultat doit être associé à un rapport conservé dans le dépôt. Une vérification non exécutée ou non archivée ne doit jamais être déclarée réussie.
