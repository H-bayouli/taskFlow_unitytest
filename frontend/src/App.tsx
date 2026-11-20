
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import axios from 'axios'
import { UserCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bell,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
  CalendarDays,
  ArrowUpRight,
  Menu,
  RefreshCw,
  Clock3,
  BriefcaseBusiness,
  ListTodo
} from 'lucide-react'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8007/api'

type User = {
  id: number
  username: string
  email: string
  role: string
  first_name?: string
  last_name?: string
  is_active?: boolean
}

type Project = {
  id: number
  name: string
  description: string
  owner: number
  owner_name?: string
  members: number[]
  task_count: number
}

type Task = {
  id: number
  title: string
  description: string
  status: string
  priority: string
  due_date: string | null
  project: number | null
  project_name?: string
  assigned_to: number | null
  assigned_username?: string
}

type Comment = {
  id: number
  task: number
  task_title?: string
  author: number
  author_name: string
  body: string
  created_at: string
}

type AuditEntry = {
  id: number
  actor_name?: string | null
  action: string
  entity: string
  details?: Record<string, unknown> | null
  entity_id: number
  created_at: string
}

type EditableItem = Partial<Task> &
  Partial<Project> &
  Partial<Comment> &
  Partial<User>

type Stats = {
  total_tasks: number
  todo: number
  in_progress: number
  review: number
  done: number
  high_priority: number
  overdue: number
  projects: number
}

type Tab =
  | 'overview'
  | 'tasks'
  | 'projects'
  | 'comments'
  | 'users'
  | 'audit'
  | 'profile'

type ListResponse<T> = {
  results?: T[]
}

type LoginResponse = {
  token: string
  user: User
}

function unwrapList<T>(data: T[] | ListResponse<T>): T[] {
  return Array.isArray(data) ? data : data.results ?? []
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail ?? fallback
  }

  return fallback
}

function validationErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (axios.isAxiosError<Record<string, unknown>>(error)) {
    const data = error.response?.data

    if (data) {
      const messages = Object.values(data)
        .flatMap(value =>
          Array.isArray(value)
            ? value.map(String)
            : [String(value)]
        )
        .join(' ')

      if (messages) return messages
    }
  }

  return fallback
}

const statusLabels: Record<string, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  review: 'En revue',
  done: 'Terminée'
}

const priorityLabels: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute'
}

const emptyStats: Stats = {
  total_tasks: 0,
  todo: 0,
  in_progress: 0,
  review: 0,
  done: 0,
  high_priority: 0,
  overdue: 0,
  projects: 0
}

function App() {
  const [token, setToken] = useState(
    localStorage.getItem('taskflow_token') || ''
  )
  const [user, setUser] = useState<User | null>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const [tab, setTab] = useState<Tab>('overview')
  const [mobileNav, setMobileNav] = useState(false)

  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [stats, setStats] = useState<Stats>(emptyStats)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const [dashFilters, setDashFilters] = useState({
    status: '',
    priority: '',
    project: ''
  })

  const [modal, setModal] = useState<
    'task' | 'project' | 'comment' | 'user' | null
  >(null)

  const [editing, setEditing] = useState<EditableItem | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  const http = useMemo(
    () =>
      axios.create({
        baseURL: API,
        headers: token
          ? { Authorization: `Token ${token}` }
          : {}
      }),
    [token]
  )

  const canManage =
    user?.role === 'admin' || user?.role === 'manager'

  const isAdmin = user?.role === 'admin'

  const logout = useCallback(() => {
    void http.post('/auth/logout/').catch(() => undefined)

    localStorage.removeItem('taskflow_token')

    setToken('')
    setUser(null)
    setTasks([])
    setProjects([])
    setComments([])
    setUsers([])
    setAudit([])
    setStats(emptyStats)
    setTab('overview')
  }, [http])

  const load = useCallback(async () => {
    if (!token) return

    try {
      const [tasksResponse, projectsResponse, dashboardResponse, commentsResponse] =
        await Promise.all([
          http.get<Task[] | ListResponse<Task>>('/tasks/'),
          http.get<Project[] | ListResponse<Project>>('/projects/'),
          http.get<Stats>('/dashboard/'),
          http.get<Comment[] | ListResponse<Comment>>('/comments/')
        ])

      setTasks(unwrapList(tasksResponse.data))
      setProjects(unwrapList(projectsResponse.data))
      setStats(dashboardResponse.data)
      setComments(unwrapList(commentsResponse.data))

      const meResponse = await http.get<User>('/auth/me/')
      const currentUser = meResponse.data

      setUser(currentUser)

      if (
        ['admin', 'manager'].includes(currentUser.role)
      ) {
        const usersResponse = await http.get<
          User[] | ListResponse<User>
        >('/users/')

        setUsers(unwrapList(usersResponse.data))
      } else {
        setUsers([])
      }

      if (currentUser.role === 'admin') {
        const auditResponse = await http.get<
          AuditEntry[] | ListResponse<AuditEntry>
        >('/audit/')

        setAudit(unwrapList(auditResponse.data))
      } else {
        setAudit([])
      }
    } catch (requestError: unknown) {
      if (
        axios.isAxiosError(requestError) &&
        requestError.response?.status === 401
      ) {
        logout()
      } else {
        setError(
          'Impossible de charger les données. Vérifiez que le serveur Django est lancé sur le port 8007.'
        )
      }
    }
  }, [http, token, logout])

  useEffect(() => {
    if (token) {
      void Promise.resolve().then(load)
    }
  }, [token, load])

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setError('')
    setBusy(true)

    try {
      const response = await axios.post<LoginResponse>(
        `${API}/auth/login/`,
        { username, password }
      )

      localStorage.setItem(
        'taskflow_token',
        response.data.token
      )

      setToken(response.data.token)
      setUser(response.data.user)
      setPassword('')
    } catch (loginError: unknown) {
      setError(
        apiErrorMessage(
          loginError,
          'Identifiants invalides ou serveur indisponible.'
        )
      )
    } finally {
      setBusy(false)
    }
  }

  function openModal(
    kind: NonNullable<typeof modal>,
    item: EditableItem | null = null
  ) {
    setEditing(item)
    setError('')

    const defaults: Record<string, Record<string, string>> = {
      task: {
        title: item?.title || '',
        description: item?.description || '',
        priority: item?.priority || 'medium',
        status: item?.status || 'todo',
        project: item?.project
          ? String(item.project)
          : '',
        assigned_to: item?.assigned_to
          ? String(item.assigned_to)
          : '',
        due_date: item?.due_date || ''
      },

      project: {
        name: item?.name || '',
        description: item?.description || '',
        members: (item?.members || []).join(',')
      },

      comment: {
        task: item?.task
          ? String(item.task)
          : '',
        body: item?.body || ''
      },

      user: {
        username: item?.username || '',
        email: item?.email || '',
        first_name: item?.first_name || '',
        last_name: item?.last_name || '',
        role: item?.role || 'member',
        password: '',
        is_active:
          item?.is_active === false ? 'false' : 'true'
      }
    }

    setForm(defaults[kind])
    setModal(kind)
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    try {
      if (modal === 'task') {
        const data = {
          ...form,
          project: form.project || null,
          assigned_to: form.assigned_to || null,
          due_date: form.due_date || null
        }

        if (editing) {
          await http.patch(`/tasks/${editing.id}/`, data)
        } else {
          await http.post('/tasks/', data)
        }
      } else if (modal === 'project') {
        const data = {
          ...form,
          members: (form.members || '')
            .split(',')
            .map(value => Number(value.trim()))
            .filter(
              value =>
                Number.isInteger(value) && value > 0
            )
        }

        if (editing) {
          await http.patch(`/projects/${editing.id}/`, data)
        } else {
          await http.post('/projects/', data)
        }
      } else if (modal === 'comment') {
        const data = {
          task: Number(form.task),
          body: form.body
        }

        if (editing) {
          await http.patch(`/comments/${editing.id}/`, data)
        } else {
          await http.post('/comments/', data)
        }
      } else if (modal === 'user') {
        const { role, ...rest } = form

        const data = {
          ...rest,
          role_input: role,
          is_active: form.is_active === 'true'
        }

        if (editing) {
          await http.patch(`/users/${editing.id}/`, data)
        } else {
          await http.post('/users/', data)
        }
      }

      setModal(null)
      setNotice('Modifications enregistrées avec succès.')

      await load()
    } catch (saveError: unknown) {
      setError(
        validationErrorMessage(
          saveError,
          'Une erreur est survenue. Vérifiez vos droits et les champs.'
        )
      )
    }
  }

  async function remove(
    kind: 'tasks' | 'projects' | 'comments' | 'users',
    id: number
  ) {
    if (
      !window.confirm('Confirmer la suppression définitive ?')
    ) {
      return
    }

    try {
      await http.delete(`/${kind}/${id}/`)

      setNotice('Élément supprimé.')

      await load()
    } catch {
      setError(
        'Suppression impossible : vérifiez vos permissions et les dépendances.'
      )
    }
  }

  async function transition(t: Task, status: string) {
    try {
      await http.post(
        `/tasks/${t.id}/transition/`,
        { status }
      )

      setNotice('Statut de la tâche mis à jour.')

      await load()
    } catch (transitionError: unknown) {
      setError(
        apiErrorMessage(
          transitionError,
          'Cette transition de workflow n’est pas autorisée.'
        )
      )
    }
  }

  const visibleTasks = tasks.filter(
    task =>
      (statusFilter === 'all' ||
        task.status === statusFilter) &&
      (priorityFilter === 'all' ||
        task.priority === priorityFilter) &&
      `${task.title} ${task.description} ${task.project_name || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
  )

  const visibleProjects = projects.filter(
    project =>
      `${project.name} ${project.description}`
        .toLowerCase()
        .includes(search.toLowerCase())
  )

  const visibleComments = comments.filter(
    comment =>
      `${comment.body} ${comment.author_name} ${comment.task_title || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())
  )

  const setField = (key: string, value: string) => {
    setForm(old => ({
      ...old,
      [key]: value
    }))
  }

  async function updateDashFilter(
    key: 'status' | 'priority' | 'project',
    value: string
  ) {
    const next = {
      ...dashFilters,
      [key]: value
    }

    setDashFilters(next)

    try {
      const params = Object.fromEntries(
        Object.entries(next).filter(([, item]) => item)
      )

      const response = await http.get<Stats>(
        '/dashboard/',
        { params }
      )

      setStats(response.data)
    } catch {
      setError(
        'Impossible d’appliquer les filtres du tableau de bord.'
      )
    }
  }

  if (!token) {
    return (
      <main className="login-screen">
        <div className="login-art">
          <div className="art-brand">
            <span className="brand-icon">
              <ClipboardList />
            </span>
            TaskFlow
          </div>

          <div className="art-copy">
            <span className="pill-light">
              WORKSPACE · PROJECT MANAGEMENT
            </span>

            <h1>
              Le travail d'équipe,
              <br />
              <em>en mouvement.</em>
            </h1>

            <p>
              Centralisez vos projets, coordonnez vos équipes
              et transformez vos objectifs en résultats.
            </p>

            <div className="art-metrics">
              <span><b>01</b> Organiser</span>
              <span><b>02</b> Collaborer</span>
              <span><b>03</b> Réussir</span>
            </div>
          </div>

          <div className="art-footer">
            TaskFlow · Plateforme de gestion collaborative
          </div>
        </div>

        <div className="login-side">
          <form className="login-card" onSubmit={login}>
            <div className="mobile-brand">
              <span className="brand-icon">
                <ClipboardList />
              </span>
              TaskFlow
            </div>

            <span className="eyebrow">
              BON RETOUR PARMI NOUS
            </span>

            <h2>Connectez-vous</h2>

            <p className="muted">
              Accédez à votre espace de travail et continuez
              là où vous en étiez.
            </p>

            <label>
              Nom d'utilisateur
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Votre identifiant"
                autoComplete="username"
                required
              />
            </label>

            <label>
              Mot de passe
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                required
              />
            </label>

            {error && <p className="error">{error}</p>}

            <button
              className="primary full"
              disabled={busy}
            >
              {busy ? 'Connexion…' : 'Se connecter'}
              <ArrowUpRight size={17} />
            </button>

            <div className="login-hint">
              <ShieldCheck size={16} />
              Connexion sécurisée · Accès selon votre rôle
            </div>
          </form>

          <div className="login-bottom">
            © 2026 TaskFlow · ISO/IEC 25010
          </div>
        </div>
      </main>
    )
  }

  const navItems: [Tab, string, LucideIcon][] = [
    ['overview', 'Vue d’ensemble', LayoutDashboard],
    ['tasks', 'Tâches', ListTodo],
    ['projects', 'Projets', FolderKanban],
    ['comments', 'Commentaires', MessageSquare],
    ['profile', 'Mon profil', UserCircle],
    ...(isAdmin
      ? [
        ['users', 'Utilisateurs', Users] as [
          Tab,
          string,
          LucideIcon
        ],
        ['audit', 'Journal d’audit', Activity] as [
          Tab,
          string,
          LucideIcon
        ]
      ]
      : [])
  ]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'show' : ''}`}>
        <div className="brand">
          <span className="brand-icon">
            <ClipboardList />
          </span>

          <span>
            TaskFlow
            <small>WORKSPACE</small>
          </span>

          <button
            className="close-nav"
            onClick={() => setMobileNav(false)}
          >
            <X />
          </button>
        </div>

        <div className="workspace-tag">
          MENU PRINCIPAL
        </div>

        <nav>
          {navItems.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`nav-item ${tab === id ? 'active' : ''}`}
              onClick={() => {
                setTab(id)
                setSearch('')
                setMobileNav(false)
              }}
            >
              <Icon size={18} />
              {label}

              {id === 'tasks' && (
                <span className="nav-count">
                  {tasks.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="quality-card">
            <div className="quality-icon">
              <ShieldCheck size={17} />
            </div>

            <div>
              <b>Espace sécurisé</b>
              <small>Authentification active</small>
            </div>

            <span className="online-dot" />
          </div>

          <div className="profile-mini">
            <div className="avatar">
              {user?.username?.slice(0, 1).toUpperCase()}
            </div>

            <div className="profile-name">
              <b>{user?.username}</b>
              <small>{user?.role}</small>
            </div>

            <button
              title="Déconnexion"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="top-left">
            <button
              className="menu-toggle"
              onClick={() => setMobileNav(true)}
            >
              <Menu />
            </button>

            <div>
              <span className="breadcrumb">
                WORKSPACE <span>/</span>{' '}
                {navItems
                  .find(item => item[0] === tab)?.[1]
                  .toUpperCase()}
              </span>

              <h1>
                {tab === 'overview'
                  ? `Bonjour ${user?.first_name || user?.username} 👋`
                  : navItems.find(item => item[0] === tab)?.[1]}
              </h1>
            </div>
          </div>

          <div className="top-actions">
            <span className="date-chip">
              <CalendarDays size={15} />
              {new Intl.DateTimeFormat('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              }).format(new Date())}
            </span>

            <button
              className="icon-btn"
              title="Actualiser"
              onClick={() => void load()}
            >
              <RefreshCw size={17} />
            </button>

            <div className="top-user">
              <div className="avatar">
                {user?.username?.slice(0, 1).toUpperCase()}
              </div>

              <div>
                <b>{user?.username}</b>
                <small>{user?.role}</small>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div className="alert error-alert">
            <span>{error}</span>
            <button onClick={() => setError('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {notice && (
          <div className="alert success-alert">
            <Check size={16} />
            {notice}
            <button onClick={() => setNotice('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {tab === 'overview' && (
          <>
            <section className="welcome-banner">
              <div>
                <span className="pill-light">
                  VOTRE ESPACE DE TRAVAIL
                </span>

                <h2>
                  Faites avancer vos projets
                  <br />
                  avec <em>clarté et impact.</em>
                </h2>

                <p>
                  Voici un aperçu de l’activité de votre espace aujourd’hui.
                </p>

                <button
                  className="banner-btn"
                  onClick={() => setTab('tasks')}
                >
                  Explorer les tâches
                  <ArrowUpRight size={16} />
                </button>
              </div>

              <div className="banner-graphic">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />

                <div className="graphic-card">
                  <div className="graphic-check">
                    <Check size={22} />
                  </div>

                  <b>Objectifs en mouvement</b>
                  <span>{stats.done} tâches terminées</span>

                  <div className="progress-track">
                    <i
                      style={{
                        width: `${stats.total_tasks
                            ? Math.round(
                              (stats.done / stats.total_tasks) * 100
                            )
                            : 0
                          }%`
                      }}
                    />
                  </div>

                  <small>
                    {stats.total_tasks
                      ? Math.round(
                        (stats.done / stats.total_tasks) * 100
                      )
                      : 0}
                    % de progression
                  </small>
                </div>

                <div className="float-bubble bubble-a">
                  <CheckCircle2 />
                </div>

                <div className="float-bubble bubble-b">
                  <Activity />
                </div>
              </div>
            </section>

            <section className="dashboard-filterbar">
              <div>
                <FilterIcon />
                <b>Filtrer les indicateurs</b>
              </div>

              <select
                value={dashFilters.project}
                onChange={e =>
                  void updateDashFilter('project', e.target.value)
                }
              >
                <option value="">Tous les projets</option>
                {projects.map(project => (
                  <option value={project.id} key={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <select
                value={dashFilters.status}
                onChange={e =>
                  void updateDashFilter('status', e.target.value)
                }
              >
                <option value="">Tous les statuts</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={dashFilters.priority}
                onChange={e =>
                  void updateDashFilter('priority', e.target.value)
                }
              >
                <option value="">Toutes les priorités</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </section>

            <section className="stats-grid">
              <Stat
                icon={ListTodo}
                label="Total des tâches"
                value={stats.total_tasks}
                note="Dans votre espace"
                tone="blue"
              />

              <Stat
                icon={Clock3}
                label="À démarrer"
                value={stats.todo}
                note="En attente"
                tone="amber"
              />

              <Stat
                icon={Activity}
                label="En progression"
                value={stats.in_progress}
                note="Actuellement actives"
                tone="violet"
              />

              <Stat
                icon={CheckCircle2}
                label="Terminées"
                value={stats.done}
                note="Objectifs accomplis"
                tone="green"
              />
            </section>

            <section className="overview-grid">
              <div className="panel">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">
                      VUE OPÉRATIONNELLE
                    </span>
                    <h3>Activité des tâches</h3>
                  </div>

                  <button
                    className="text-action"
                    onClick={() => setTab('tasks')}
                  >
                    Tout voir
                    <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="status-bars">
                  {[
                    ['À faire', stats.todo, 'todo'],
                    ['En cours', stats.in_progress, 'progress'],
                    ['En revue', stats.review, 'review'],
                    ['Terminées', stats.done, 'done']
                  ].map(([label, value, key]) => (
                    <div className="bar-line" key={String(key)}>
                      <div>
                        <span>{label}</span>
                        <b>{value}</b>
                      </div>

                      <div className="bar-track">
                        <i
                          className={String(key)}
                          style={{
                            width: `${stats.total_tasks
                                ? (Number(value) / stats.total_tasks) * 100
                                : 0
                              }%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel attention-panel">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">
                      À SURVEILLER
                    </span>
                    <h3>Points d’attention</h3>
                  </div>

                  <Bell size={18} className="muted-icon" />
                </div>

                <div className="attention-item">
                  <span className="attention-icon overdue">
                    <Clock3 />
                  </span>

                  <div>
                    <b>{stats.overdue} tâches en retard</b>
                    <small>
                      Échéance dépassée, non terminées
                    </small>
                  </div>
                </div>

                <div className="attention-item">
                  <span className="attention-icon urgent">
                    <Activity />
                  </span>

                  <div>
                    <b>{stats.high_priority} priorités hautes</b>
                    <small>
                      Demandent une attention particulière
                    </small>
                  </div>
                </div>

                <div className="attention-item">
                  <span className="attention-icon projects">
                    <BriefcaseBusiness />
                  </span>

                  <div>
                    <b>{projects.length} projets</b>
                    <small>Espaces de collaboration</small>
                  </div>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <span className="eyebrow">
                    DERNIÈRES ACTIVITÉS
                  </span>
                  <h3>Tâches récentes</h3>
                </div>

                <button
                  className="text-action"
                  onClick={() => setTab('tasks')}
                >
                  Voir les tâches
                  <ArrowUpRight size={15} />
                </button>
              </div>

              <TaskTable
                tasks={tasks.slice(0, 5)}
                canManage={Boolean(canManage)}
                onEdit={task => openModal('task', task)}
                onDelete={task => void remove('tasks', task.id)}
                onTransition={transition}
              />
            </section>
          </>
        )}

        {tab === 'tasks' && (
          <section className="panel page-panel">
            <PageHead
              eyebrow="SUIVI & EXÉCUTION"
              title="Toutes les tâches"
              subtitle="Planifiez, attribuez et suivez l’avancement du travail."
              action={
                canManage ? (
                  <button
                    className="primary"
                    onClick={() => openModal('task')}
                  >
                    <Plus size={17} />
                    Nouvelle tâche
                  </button>
                ) : null
              }
            />

            <Toolbar
              search={search}
              setSearch={setSearch}
              placeholder="Rechercher une tâche…"
            >
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
              >
                <option value="all">Toutes priorités</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Toolbar>

            <TaskTable
              tasks={visibleTasks}
              canManage={Boolean(canManage)}
              onEdit={task => openModal('task', task)}
              onDelete={task => void remove('tasks', task.id)}
              onTransition={transition}
            />
          </section>
        )}

        {tab === 'projects' && (
          <section className="panel page-panel">
            <PageHead
              eyebrow="ORGANISATION"
              title="Vos projets"
              subtitle="Organisez les initiatives et rassemblez les tâches de chaque projet."
              action={
                canManage ? (
                  <button
                    className="primary"
                    onClick={() => openModal('project')}
                  >
                    <Plus size={17} />
                    Nouveau projet
                  </button>
                ) : null
              }
            />

            <Toolbar
              search={search}
              setSearch={setSearch}
              placeholder="Rechercher un projet…"
            />

            <div className="project-grid">
              {visibleProjects.map(project => (
                <article className="project-tile" key={project.id}>
                  <div className="project-tile-top">
                    <span className="project-symbol">
                      <FolderKanban />
                    </span>

                    <span className="project-id">
                      PROJET #{String(project.id).padStart(3, '0')}
                    </span>
                  </div>

                  <h3>{project.name}</h3>

                  <p>
                    {project.description ||
                      'Aucune description pour le moment.'}
                  </p>

                  <div className="project-meta">
                    <span>
                      <ListTodo size={14} />
                      {project.task_count} tâches
                    </span>

                    <span>
                      <Users size={14} />
                      {project.members?.length || 0} membres
                    </span>
                  </div>

                  {canManage && (
                    <div className="tile-actions">
                      <button
                        onClick={() => openModal('project', project)}
                      >
                        <Pencil size={15} />
                        Modifier
                      </button>

                      <button
                        className="danger-text"
                        onClick={() =>
                          void remove('projects', project.id)
                        }
                      >
                        <Trash2 size={15} />
                        Supprimer
                      </button>
                    </div>
                  )}
                </article>
              ))}

              {!visibleProjects.length && (
                <Empty text="Aucun projet trouvé." />
              )}
            </div>
          </section>
        )}

        {tab === 'comments' && (
          <section className="panel page-panel">
            <PageHead
              eyebrow="COLLABORATION"
              title="Commentaires"
              subtitle="Échangez autour des tâches et gardez le contexte au même endroit."
              action={
                <button
                  className="primary"
                  onClick={() => openModal('comment')}
                >
                  <Plus size={17} />
                  Ajouter un commentaire
                </button>
              }
            />

            <Toolbar
              search={search}
              setSearch={setSearch}
              placeholder="Rechercher dans les commentaires…"
            />

            <div className="comment-list">
              {visibleComments.map(comment => (
                <article
                  className="comment-card"
                  key={comment.id}
                >
                  <div className="avatar">
                    {comment.author_name?.slice(0, 1).toUpperCase()}
                  </div>

                  <div className="comment-content">
                    <div className="comment-meta">
                      <b>{comment.author_name}</b>
                      <span>sur tâche #{comment.task}</span>

                      <time>
                        {new Date(comment.created_at).toLocaleString(
                          'fr-FR'
                        )}
                      </time>
                    </div>

                    <p>{comment.body}</p>
                    <small>TaskFlow · Commentaire</small>
                  </div>

                  {(canManage || comment.author === user?.id) && (
                    <div className="row-actions">
                      <button
                        title="Modifier"
                        onClick={() =>
                          openModal('comment', comment)
                        }
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        title="Supprimer"
                        className="danger"
                        onClick={() =>
                          void remove('comments', comment.id)
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </article>
              ))}

              {!visibleComments.length && (
                <Empty text="Aucun commentaire trouvé." />
              )}
            </div>
          </section>
        )}

        {tab === 'users' && isAdmin && (
          <section className="panel page-panel">
            <PageHead
              eyebrow="ADMINISTRATION"
              title="Gestion des utilisateurs"
              subtitle="Gérez les comptes et attribuez les rôles d’accès."
              action={
                <button
                  className="primary"
                  onClick={() => openModal('user')}
                >
                  <Plus size={17} />
                  Nouvel utilisateur
                </button>
              }
            />

            <Toolbar
              search={search}
              setSearch={setSearch}
              placeholder="Rechercher un utilisateur…"
            />

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users
                    .filter(userItem =>
                      `${userItem.username} ${userItem.email}`
                        .toLowerCase()
                        .includes(search.toLowerCase())
                    )
                    .map(userItem => (
                      <tr key={userItem.id}>
                        <td>
                          <div className="person-cell">
                            <span className="avatar">
                              {userItem.username
                                .slice(0, 1)
                                .toUpperCase()}
                            </span>

                            <b>
                              {userItem.first_name ||
                                userItem.username}{' '}
                              {userItem.last_name || ''}
                            </b>
                          </div>
                        </td>

                        <td>{userItem.email || '—'}</td>

                        <td>
                          <span
                            className={`role-badge ${userItem.role}`}
                          >
                            {userItem.role}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status-dot ${userItem.is_active === false ? 'off' : ''
                              }`}
                          >
                            {userItem.is_active === false
                              ? 'Inactif'
                              : 'Actif'}
                          </span>
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              onClick={() =>
                                openModal('user', userItem)
                              }
                            >
                              <Pencil size={15} />
                            </button>

                            {userItem.id !== user?.id && (
                              <button
                                className="danger"
                                onClick={() =>
                                  void remove('users', userItem.id)
                                }
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'audit' && isAdmin && (
          <section className="panel page-panel">
            <PageHead
              eyebrow="TRAÇABILITÉ & SÉCURITÉ"
              title="Journal d’audit"
              subtitle="Historique des actions sensibles réalisées sur la plateforme."
            />

            <div className="audit-list">
              {audit
                .filter(entry =>
                  `${entry.actor_name || ''} ${entry.action} ${entry.entity}`
                    .toLowerCase()
                    .includes(search.toLowerCase())
                )
                .map(entry => (
                  <article className="audit-row" key={entry.id}>
                    <span className="audit-mark">
                      <Activity size={16} />
                    </span>

                    <div>
                      <b>
                        {entry.actor_name || 'Système'}{' '}
                        <span>{entry.action}</span>{' '}
                        {entry.entity}
                      </b>

                      <small>
                        {entry.details
                          ? JSON.stringify(entry.details)
                          : ''}{' '}
                        · #{entry.entity_id}
                      </small>
                    </div>

                    <time>
                      {new Date(entry.created_at).toLocaleString(
                        'fr-FR'
                      )}
                    </time>
                  </article>
                ))}

              {!audit.length && (
                <Empty text="Aucune action enregistrée pour le moment." />
              )}
            </div>
          </section>
        )}

        {tab === 'profile' && user && (
          <section className="panel page-panel profile-page">
            <PageHead
              eyebrow="VOTRE COMPTE"
              title="Mon profil"
              subtitle="Consultez les informations de votre compte TaskFlow."
            />

            <div className="profile-header">
              <div className="profile-large-avatar">
                {user.username.slice(0, 1).toUpperCase()}
              </div>

              <div>
                <h2>
                  {user.first_name || user.username}{' '}
                  {user.last_name || ''}
                </h2>
                <p>{user.email || 'Aucune adresse email'}</p>

                <span className={`role-badge ${user.role}`}>
                  {user.role}
                </span>
              </div>
            </div>

            <div className="profile-details">
              <div className="profile-detail">
                <span>Nom d'utilisateur</span>
                <strong>{user.username}</strong>
              </div>

              <div className="profile-detail">
                <span>Prénom</span>
                <strong>{user.first_name || 'Non renseigné'}</strong>
              </div>

              <div className="profile-detail">
                <span>Nom</span>
                <strong>{user.last_name || 'Non renseigné'}</strong>
              </div>

              <div className="profile-detail">
                <span>Adresse email</span>
                <strong>{user.email || 'Non renseignée'}</strong>
              </div>

              <div className="profile-detail">
                <span>Rôle</span>
                <strong>{user.role}</strong>
              </div>

              <div className="profile-detail">
                <span>État du compte</span>
                <strong>
                  {user.is_active === false ? 'Inactif' : 'Actif'}
                </strong>
              </div>
            </div>
          </section>
        )}
        <footer className="app-footer">
          <span>
            TaskFlow <i>·</i> Gestion collaborative de projets
          </span>

          <span>
            <ShieldCheck size={14} />
            Conçu selon les exigences ISO/IEC 25010
          </span>
        </footer>
      </main>

      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setModal(null)
            }
          }}
        >
          <form className="modal-card" onSubmit={save}>
            <div className="modal-head">
              <div>
                <span className="eyebrow">
                  {editing ? 'MODIFICATION' : 'NOUVEL ÉLÉMENT'}
                </span>

                <h2>
                  {modal === 'task'
                    ? editing
                      ? 'Modifier la tâche'
                      : 'Créer une tâche'
                    : modal === 'project'
                      ? editing
                        ? 'Modifier le projet'
                        : 'Créer un projet'
                      : modal === 'comment'
                        ? editing
                          ? 'Modifier le commentaire'
                          : 'Ajouter un commentaire'
                        : editing
                          ? 'Modifier utilisateur'
                          : 'Créer utilisateur'}
                </h2>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={() => setModal(null)}
              >
                <X />
              </button>
            </div>

            {modal === 'task' && (
              <>
                <label>
                  Titre de la tâche
                  <input
                    value={form.title || ''}
                    onChange={e =>
                      setField('title', e.target.value)
                    }
                    minLength={3}
                    maxLength={120}
                    required
                    placeholder="Ex. Préparer la présentation"
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={form.description || ''}
                    onChange={e =>
                      setField('description', e.target.value)
                    }
                    rows={3}
                    placeholder="Détails et objectifs…"
                  />
                </label>

                <div className="form-two">
                  <label>
                    Priorité
                    <select
                      value={form.priority}
                      onChange={e =>
                        setField('priority', e.target.value)
                      }
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                    </select>
                  </label>

                  <label>
                    Statut
                    <select
                      value={form.status}
                      onChange={e =>
                        setField('status', e.target.value)
                      }
                    >
                      {Object.entries(statusLabels).map(
                        ([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>

                <div className="form-two">
                  <label>
                    Projet
                    <select
                      value={form.project}
                      onChange={e =>
                        setField('project', e.target.value)
                      }
                    >
                      <option value="">Sans projet</option>

                      {projects.map(project => (
                        <option
                          value={project.id}
                          key={project.id}
                        >
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Assigné à
                    <select
                      value={form.assigned_to}
                      onChange={e =>
                        setField('assigned_to', e.target.value)
                      }
                    >
                      <option value="">Non assigné</option>

                      {users.map(userItem => (
                        <option
                          value={userItem.id}
                          key={userItem.id}
                        >
                          {userItem.username}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  Date d’échéance
                  <input
                    type="date"
                    value={form.due_date || ''}
                    onChange={e =>
                      setField('due_date', e.target.value)
                    }
                  />
                </label>
              </>
            )}

            {modal === 'project' && (
              <>
                <label>
                  Nom du projet
                  <input
                    value={form.name || ''}
                    onChange={e =>
                      setField('name', e.target.value)
                    }
                    minLength={3}
                    required
                    placeholder="Nom du projet"
                  />
                </label>

                <label>
                  Description
                  <textarea
                    rows={4}
                    value={form.description || ''}
                    onChange={e =>
                      setField('description', e.target.value)
                    }
                    placeholder="Présentez les objectifs du projet…"
                  />
                </label>

                <label>
                  Membres du projet
                  <select
                    multiple
                    value={(form.members || '')
                      .split(',')
                      .filter(Boolean)}
                    onChange={e =>
                      setField(
                        'members',
                        Array.from(
                          e.target.selectedOptions
                        )
                          .map(option => option.value)
                          .join(',')
                      )
                    }
                  >
                    {users.map(userItem => (
                      <option
                        value={userItem.id}
                        key={userItem.id}
                      >
                        {userItem.username} · {userItem.role}
                      </option>
                    ))}
                  </select>

                  <small className="field-hint">
                    Maintenez Ctrl pour sélectionner plusieurs membres.
                  </small>
                </label>
              </>
            )}

            {modal === 'comment' && (
              <>
                <label>
                  Tâche associée
                  <select
                    value={form.task || ''}
                    onChange={e =>
                      setField('task', e.target.value)
                    }
                    required
                  >
                    <option value="">
                      Sélectionner une tâche
                    </option>

                    {tasks.map(task => (
                      <option value={task.id} key={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Votre commentaire
                  <textarea
                    rows={5}
                    maxLength={2000}
                    value={form.body || ''}
                    onChange={e =>
                      setField('body', e.target.value)
                    }
                    required
                    placeholder="Écrivez votre commentaire…"
                  />
                </label>
              </>
            )}

            {modal === 'user' && (
              <>
                <div className="form-two">
                  <label>
                    Nom d'utilisateur
                    <input
                      value={form.username || ''}
                      onChange={e =>
                        setField('username', e.target.value)
                      }
                      required
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={e =>
                        setField('email', e.target.value)
                      }
                      required
                    />
                  </label>
                </div>

                <div className="form-two">
                  <label>
                    Prénom
                    <input
                      value={form.first_name || ''}
                      onChange={e =>
                        setField('first_name', e.target.value)
                      }
                    />
                  </label>

                  <label>
                    Nom
                    <input
                      value={form.last_name || ''}
                      onChange={e =>
                        setField('last_name', e.target.value)
                      }
                    />
                  </label>
                </div>

                <label>
                  {editing
                    ? 'Nouveau mot de passe (facultatif)'
                    : 'Mot de passe'}

                  <input
                    type="password"
                    minLength={8}
                    value={form.password || ''}
                    onChange={e =>
                      setField('password', e.target.value)
                    }
                    required={!editing}
                    placeholder="8 caractères minimum"
                  />
                </label>

                <div className="form-two">
                  <label>
                    Rôle
                    <select
                      value={form.role}
                      onChange={e =>
                        setField('role', e.target.value)
                      }
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>

                  <label>
                    Compte
                    <select
                      value={form.is_active}
                      onChange={e =>
                        setField('is_active', e.target.value)
                      }
                    >
                      <option value="true">Actif</option>
                      <option value="false">Inactif</option>
                    </select>
                  </label>
                </div>
              </>
            )}

            {error && (
              <p className="error modal-error">{error}</p>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setModal(null)}
              >
                Annuler
              </button>

              <button className="primary">
                {editing
                  ? 'Enregistrer les modifications'
                  : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function FilterIcon() {
  return <Search size={15} />
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
  tone
}: {
  icon: LucideIcon
  label: string
  value: number
  note: string
  tone: 'blue' | 'amber' | 'violet' | 'green'
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={19} />
      </div>

      <div className="stat-label">{label}</div>
      <strong>{value || 0}</strong>
      <small>{note}</small>
    </article>
  )
}

function PageHead({
  eyebrow,
  title,
  subtitle,
  action
}: {
  eyebrow: string
  title: string
  subtitle: string
  action?: ReactNode
}) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      {action}
    </div>
  )
}

function Toolbar({
  search,
  setSearch,
  placeholder,
  children
}: {
  search: string
  setSearch: (value: string) => void
  placeholder: string
  children?: ReactNode
}) {
  return (
    <div className="toolbar">
      <div className="search-box">
        <Search size={17} />

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={placeholder}
        />
      </div>

      {children}
    </div>
  )
}

function TaskTable({
  tasks,
  canManage,
  onEdit,
  onDelete,
  onTransition
}: {
  tasks: Task[]
  canManage: boolean
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onTransition: (task: Task, status: string) => void
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Tâche</th>
            <th>Projet</th>
            <th>Priorité</th>
            <th>Statut / Workflow</th>
            <th>Échéance</th>
            {canManage && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td>
                <div className="task-cell">
                  <span className={`task-dot ${task.status}`}>
                    <Circle size={16} />
                  </span>

                  <div>
                    <b>{task.title}</b>
                    <small>
                      {task.description || 'Aucune description'}
                    </small>
                  </div>
                </div>
              </td>

              <td>{task.project_name || '—'}</td>

              <td>
                <span
                  className={`priority-badge ${task.priority}`}
                >
                  {priorityLabels[task.priority] || task.priority}
                </span>
              </td>

              <td>
                <select
                  className={`status-select ${task.status}`}
                  value={task.status}
                  disabled={!canManage}
                  onChange={e =>
                    onTransition(task, e.target.value)
                  }
                >
                  {Object.entries(statusLabels).map(
                    ([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </td>

              <td>{task.due_date || '—'}</td>

              {canManage && (
                <td>
                  <div className="row-actions">
                    <button
                      title="Modifier"
                      onClick={() => onEdit(task)}
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      title="Supprimer"
                      className="danger"
                      onClick={() => onDelete(task)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}

          {!tasks.length && (
            <tr>
              <td colSpan={canManage ? 6 : 5}>
                <div className="empty-state">
                  <ClipboardList size={27} />
                  <b>Aucune tâche trouvée</b>
                  <span>
                    Les tâches apparaîtront ici dès leur création.
                  </span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Search size={26} />
      <b>{text}</b>
    </div>
  )
}

export default App
