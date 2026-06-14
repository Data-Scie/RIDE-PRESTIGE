# Run this once after PostgreSQL 18 is installed
# It creates the database and user for Ride Prestige

$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$env:PGPASSWORD = "rp_secret_2026"

Write-Host "Creating database and user..." -ForegroundColor Cyan

# Create the user
& "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE USER rp_user WITH PASSWORD 'rp_secret_2026';" 2>&1

# Create the database owned by rp_user
& "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE ride_prestige OWNER rp_user;" 2>&1

# Grant all privileges
& "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE ride_prestige TO rp_user;" 2>&1

Write-Host "Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  cd server"
Write-Host "  npx prisma migrate dev --name init"
Write-Host "  npm run db:seed"
Write-Host "  npm run dev"
