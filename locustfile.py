"""Charge API authentifiée. Définir TASKFLOW_TOKEN avant de lancer Locust."""
import os
from locust import HttpUser, task, between

class TaskFlowUser(HttpUser):
    wait_time = between(1, 3)
    def on_start(self):
        self.client.headers.update({'Authorization': f"Token {os.environ.get('TASKFLOW_TOKEN', '')}"})
    @task(3)
    def list_tasks(self): self.client.get('/api/tasks/', name='/api/tasks/')
    @task(1)
    def dashboard(self): self.client.get('/api/dashboard/', name='/api/dashboard/')
