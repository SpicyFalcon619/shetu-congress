# Starts the API (port 8000) and the web app (port 3000) in two new windows, then opens the browser.
# Usage, from this folder:  .\dev.ps1
$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\apps\api'; uv sync; uv run uvicorn shetu_api.main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\apps\web'; pnpm install; pnpm dev"

Write-Host "Starting... the site opens at http://localhost:3000 in a few seconds."
Start-Sleep -Seconds 8
Start-Process "http://localhost:3000"
