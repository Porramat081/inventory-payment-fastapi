@echo off
cd /d %~dp0

start "inventory-api"      cmd /k "cd inventory && .venv\Scripts\python -m uvicorn main:app --reload --port 8000"
start "inventory-consumer" cmd /k "cd inventory && .venv\Scripts\python consumer.py"

start "payment-api"        cmd /k "cd payment && .venv\Scripts\python -m uvicorn main:app --reload --port 8001"
start "payment-consumer"   cmd /k "cd payment && .venv\Scripts\python consumer.py"

start "inventory-frontend" cmd /k "cd inventory-frontend && npm run dev"