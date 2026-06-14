# Start PostgreSQL 18 (run this after every reboot)
$pgBin  = "C:\Program Files\PostgreSQL\18\bin"
$pgData = "C:\Users\act22aa\pgdata"

$env:PATH = "$pgBin;" + $env:PATH

# Check if already running
try {
    $env:PGPASSWORD = "rp_secret_2026"
    & "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -c "SELECT 1" -q 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Host "PostgreSQL already running." -ForegroundColor Green; exit 0 }
} catch {}

Write-Host "Starting PostgreSQL 18..." -ForegroundColor Cyan
& "$pgBin\pg_ctl.exe" -D "$pgData" -l "$pgData\pg.log" start

Start-Sleep -Seconds 3
$env:PGPASSWORD = "rp_secret_2026"
$result = & "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -c "SELECT version();" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL 18 is running on port 5432." -ForegroundColor Green
} else {
    Write-Host "Failed to start. Check log: $pgData\pg.log" -ForegroundColor Red
}
