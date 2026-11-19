from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone

class Migration(migrations.Migration):
    dependencies = [('tasks','0001_initial'), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(name='Project', fields=[('id',models.BigAutoField(auto_created=True,primary_key=True,serialize=False,verbose_name='ID')),('name',models.CharField(max_length=140)),('description',models.TextField(blank=True)),('created_at',models.DateTimeField(auto_now_add=True)),('updated_at',models.DateTimeField(auto_now=True)),('owner',models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,related_name='owned_projects',to=settings.AUTH_USER_MODEL)),('members',models.ManyToManyField(blank=True,related_name='projects',to=settings.AUTH_USER_MODEL))]),
        migrations.CreateModel(name='UserProfile', fields=[('id',models.BigAutoField(auto_created=True,primary_key=True,serialize=False,verbose_name='ID')),('role',models.CharField(choices=[('admin','Admin'),('manager','Manager'),('member','Member')],default='member',max_length=12)),('user',models.OneToOneField(on_delete=django.db.models.deletion.CASCADE,related_name='profile',to=settings.AUTH_USER_MODEL))]),
        migrations.AddField(model_name='task',name='project',field=models.ForeignKey(blank=True,null=True,on_delete=django.db.models.deletion.CASCADE,related_name='tasks',to='tasks.project')),
        migrations.AddField(model_name='task',name='assigned_to',field=models.ForeignKey(blank=True,null=True,on_delete=django.db.models.deletion.SET_NULL,related_name='assigned_tasks',to=settings.AUTH_USER_MODEL)),
        migrations.AddField(model_name='task',name='created_by',field=models.ForeignKey(blank=True,null=True,on_delete=django.db.models.deletion.SET_NULL,related_name='created_tasks',to=settings.AUTH_USER_MODEL)),
        migrations.AddField(model_name='task',name='updated_at',field=models.DateTimeField(auto_now=True)),
        migrations.AlterField(model_name='task',name='status',field=models.CharField(choices=[('todo','To do'),('in_progress','In progress'),('review','Review'),('done','Done')],default='todo',max_length=20)),
        migrations.CreateModel(name='Comment',fields=[('id',models.BigAutoField(auto_created=True,primary_key=True,serialize=False,verbose_name='ID')),('body',models.TextField(max_length=2000)),('created_at',models.DateTimeField(auto_now_add=True)),('author',models.ForeignKey(on_delete=django.db.models.deletion.PROTECT,related_name='task_comments',to=settings.AUTH_USER_MODEL)),('task',models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name='comments',to='tasks.task'))]),
        migrations.CreateModel(name='AuditLog',fields=[('id',models.BigAutoField(auto_created=True,primary_key=True,serialize=False,verbose_name='ID')),('action',models.CharField(max_length=80)),('entity',models.CharField(max_length=80)),('entity_id',models.CharField(blank=True,max_length=40)),('details',models.JSONField(blank=True,default=dict)),('ip_address',models.GenericIPAddressField(blank=True,null=True)),('created_at',models.DateTimeField(default=django.utils.timezone.now,editable=False)),('actor',models.ForeignKey(null=True,on_delete=django.db.models.deletion.SET_NULL,related_name='audit_events',to=settings.AUTH_USER_MODEL))],options={'ordering':['-created_at']}),
    ]
