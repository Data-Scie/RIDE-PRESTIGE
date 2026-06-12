# Ride Prestige Backend — one-click start
Set-Location $PSScriptRoot
$env:PORT       = "4000"
$env:NODE_ENV   = "development"
$env:JWT_SECRET = "ride-prestige-super-secret-jwt-key-2026"

Write-Host ""
Write-Host "  Building..." -ForegroundColor Cyan
npx tsc

Write-Host "  Starting server on http://localhost:4000" -ForegroundColor Green
Write-Host "  Swagger UI  -> http://localhost:4000/api-docs" -ForegroundColor Yellow
Write-Host "  Health      -> http://localhost:4000/health" -ForegroundColor Yellow
Write-Host ""

node dist/index.js
