
import secrets

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from tasks.models import Project, Task, UserProfile


class Command(BaseCommand):
    help = (
        "Create local demonstration users and sample TaskFlow data "
        "(development only)."
    )

    def handle(self, *args, **options):
        User = get_user_model()

        demo = [
            ("admin", "admin"),
            ("manager", "manager"),
            ("member", "member"),
        ]

        users = {}
        generated_credentials = []

        for username, role in demo:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={"email": f"{username}@taskflow.local"},
            )

            if created:
                password = secrets.token_urlsafe(24)
                user.set_password(password)
                generated_credentials.append((username, password))

            user.is_staff = role == "admin"
            user.is_superuser = role == "admin"
            user.save()

            UserProfile.objects.update_or_create(
                user=user,
                defaults={"role": role},
            )

            users[username] = user

        project, _ = Project.objects.get_or_create(
            name="Projet de démonstration",
            defaults={
                "description": "Espace exemple TaskFlow",
                "owner": users["manager"],
            },
        )

        project.members.add(users["manager"], users["member"])

        Task.objects.get_or_create(
            title="Préparer la démonstration",
            defaults={
                "project": project,
                "description": "Vérifier le workflow et le tableau de bord.",
                "priority": "high",
                "assigned_to": users["member"],
                "created_by": users["manager"],
            },
        )

        self.stdout.write(
            self.style.SUCCESS("Données de démonstration créées.")
        )

        if generated_credentials:
            self.stdout.write(
                self.style.WARNING(
                    "Mots de passe générés. Copiez-les maintenant :"
                )
            )

            for username, password in generated_credentials:
                self.stdout.write(f"{username}: {password}")
        else:
            self.stdout.write(
                "Les comptes existent déjà. Leurs mots de passe sont inchangés."
            )
