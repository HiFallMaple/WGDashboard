import multiprocessing
import dashboard
import os

app_host, app_port = dashboard.get_host_bind()

worker_class = 'gthread'
workers = multiprocessing.cpu_count() * 2 + 1
threads = 4
bind = f"{app_host}:{app_port}"
daemon = False if os.getenv("IN_DOCKER", 0)=='1' else True
pidfile = './gunicorn.pid'
