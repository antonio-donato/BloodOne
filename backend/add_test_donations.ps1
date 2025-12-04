# Script per aggiungere donazioni di test
# Assicurati che il backend sia in esecuzione

$token = "YOUR_JWT_TOKEN_HERE"
$baseUrl = "http://localhost:8080"

# Donazione recente per donatore 1 (Antonio)
$donation1 = @{
    donor_id = 1
    donation_date = "2025-09-15T10:00:00Z"
    blood_type = "A+"
    quantity_ml = 450
    notes = "Donazione test recente"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/admin/donations" -Method POST -Body $donation1 -ContentType "application/json" -Headers @{Authorization="Bearer $token"}

# Donazione vecchia per donatore 2 (Marisa) - oltre 6 mesi fa
$donation2 = @{
    donor_id = 2
    donation_date = "2024-05-01T10:00:00Z"
    blood_type = "A+"
    quantity_ml = 450
    notes = "Donazione test vecchia - scaduta"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/admin/donations" -Method POST -Body $donation2 -ContentType "application/json" -Headers @{Authorization="Bearer $token"}

Write-Host "Donazioni di test aggiunte con successo!"
