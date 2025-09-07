# backend/lasko_backend/celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lasko_backend.settings')
app = Celery('lasko_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()