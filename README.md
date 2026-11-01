# TaskFlow — Task Management API

A RESTful Task Management API built with Django REST Framework, with a strong focus on software quality, automated testing, maintainability, and continuous integration.

## 🎯 Project Objectives

TaskFlow is a learning project designed to apply software quality engineering principles in a real application.

The main objectives are to:

- Develop a REST API using Django REST Framework.
- Apply unit testing and integration testing.
- Validate inputs and handle errors correctly.
- Measure code coverage with coverage.py.
- Detect code quality issues with Ruff.
- Automate quality checks using GitHub Actions.
- Prevent regressions through automated tests.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Programming language |
| Django | Web framework |
| Django REST Framework | REST API development |
| pytest | Automated test execution |
| pytest-django | Django testing integration |
| coverage.py | Code coverage measurement |
| Ruff | Linting and code quality |
| GitHub Actions | Continuous integration |
| SQLite | Development and test database |

## ✨ Features

- Create, retrieve, update, and delete tasks.
- Validate task titles.
- Assign priorities: Low, Medium, High.
- Track statuses: To Do, In Progress, Done.
- Set optional deadlines.
- Filter tasks by status and priority.
- Validate API requests and return appropriate HTTP errors.

## 📁 Project Structure

```text
taskflow/
├── config/
│   ├── settings.py
│   └── urls.py
├── tasks/
│   ├── migrations/
│   ├── tests/
│   │   ├── test_services.py
│   │   ├── test_api.py
│   │   └── test_models.py
│   ├── models.py
│   ├── serializers.py
│   ├── services.py
│   ├── urls.py
│   └── views.py
├── .github/
│   └── workflows/
│       └── quality.yml
├── .coveragerc
├── .gitignore
├── manage.py
├── pytest.ini
├── pyproject.toml
├── requirements.txt
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

- Python 3.12 or a compatible Python version.
- pip and venv.
- Git.

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd taskflow
```

### 2. Create a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Apply database migrations

```bash
python manage.py migrate
```

### 5. Run the development server

```bash
python manage.py runserver
```

The API will be available at:

`http://127.0.0.1:8000/api/tasks/`

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/` | List tasks |
| POST | `/api/tasks/` | Create a task |
| GET | `/api/tasks/{id}/` | Retrieve a task |
| PATCH | `/api/tasks/{id}/` | Partially update a task |
| PUT | `/api/tasks/{id}/` | Replace a task |
| DELETE | `/api/tasks/{id}/` | Delete a task |

### Example: Create a Task

Request:

```http
POST /api/tasks/
Content-Type: application/json
```

```json
{
  "title": "Learn unit testing",
  "description": "Practice pytest and coverage",
  "priority": "high",
  "status": "todo",
  "due_date": "2026-12-15"
}
```

Example successful response: HTTP `201 Created`.

### Filtering

Filter tasks by priority:

`GET /api/tasks/?priority=high`

Filter tasks by status:

`GET /api/tasks/?status=done`

Combine filters:

`GET /api/tasks/?priority=high&status=todo`

## 🧪 Testing Strategy

TaskFlow uses automated tests to verify business rules and API behavior.

### Unit Tests

Test individual functions independently, including:

- Task title validation.
- Priority score calculation.
- Invalid input handling.
- Boundary values.

Run unit tests:

```bash
pytest tasks/tests/test_services.py -v
```

### Integration Tests

Test interactions between the API, serializers, views, and database.

Scenarios include:

- Creating a valid task.
- Rejecting invalid input.
- Listing and filtering tasks.
- Updating task status.
- Deleting tasks.
- Handling nonexistent task IDs.

Run integration tests:

```bash
pytest tasks/tests/test_api.py -v
```

### Run All Tests

```bash
pytest -v
```

## 📊 Code Coverage

Measure the code executed during tests:

```bash
coverage erase
coverage run -m pytest
coverage report -m
```

Generate an HTML report:

```bash
coverage html
```

Open it on Linux:

```bash
xdg-open htmlcov/index.html
```

The project uses an initial coverage target of 85%, configured in `.coveragerc`.

Coverage is a useful metric, but it does not guarantee that every important behavior is tested.

## 🔍 Code Quality

Run Ruff to detect common Python issues:

```bash
ruff check .
```

Check Django configuration:

```bash
python manage.py check
```

Check whether model changes require new migrations:

```bash
python manage.py makemigrations --check --dry-run
```

## 🔄 Continuous Integration

GitHub Actions automatically runs quality checks when code is pushed to configured branches or a pull request is opened.

The pipeline includes:

1. Checking out the repository.
2. Setting up Python.
3. Installing dependencies.
4. Running Ruff.
5. Checking Django configuration and migrations.
6. Executing tests with coverage.

A failing test or a violated coverage threshold causes the pipeline to fail.

## 📐 Software Quality Principles

This project explores the following concepts:

- **Correctness:** the application follows its business rules.
- **Reliability:** expected behavior is preserved across changes.
- **Maintainability:** code is organized into understandable modules.
- **Testability:** business logic can be tested independently.
- **Regression testing:** tests detect previously fixed bugs.
- **Code coverage:** measurement of executed lines and branches.
- **Continuous integration:** automated verification of code changes.

## 🚀 Future Improvements

- Add authentication and task ownership.
- Introduce pagination and search.
- Add PostgreSQL support.
- Add API documentation using OpenAPI/Swagger.
- Introduce mutation testing to evaluate test effectiveness.
- Integrate SonarQube for maintainability analysis.
- Add Docker support.
- Expand integration and permission tests.

## 📚 Learning Outcomes

By completing TaskFlow, the developer will gain practical experience with Django REST APIs, unit testing, integration testing, coverage analysis, static code analysis, regression prevention, and automated CI pipelines.

## 👤 Author

**Your Name**

- GitHub: YOUR_GITHUB_USERNAME

## 📄 License

Choose and add an appropriate open-source license if you intend to distribute the project.
