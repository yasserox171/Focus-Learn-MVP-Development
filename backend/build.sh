#!/usr/bin/env bash
# Build step for managed hosts (Render/Railway). Installs deps, collects
# static files, and applies migrations.
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input
