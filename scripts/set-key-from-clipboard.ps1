# 클립보드에 복사해 둔 OpenRouter 키를 .env에 넣어 준다.
# 붙여 넣을 필요 없이, 키를 복사한 뒤 Enter만 누르면 된다.
#
# 쓰는 법:  powershell -ExecutionPolicy Bypass -File D:\study_06\scripts\set-key-from-clipboard.ps1

$envPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\.env'))

if (-not (Test-Path $envPath)) {
    Copy-Item ([System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\.env.example'))) $envPath
    Write-Host ".env가 없어 .env.example에서 새로 만들었습니다."
}

Write-Host ""
Write-Host "1) OpenRouter 키를 복사하세요 (Ctrl+C)." -ForegroundColor Cyan
Write-Host "   - 새 키: openrouter.ai의 Keys에서 Create Key로 만들면 뜨는 값을 복사"
Write-Host "   - 쓰던 키: 메모장으로 D:주차\.env를 열어 OPENROUTER_API_KEY= 뒤의 값을 복사"
Write-Host "2) 복사했으면 여기서 Enter를 누르세요." -ForegroundColor Cyan
Read-Host "준비되면 Enter" | Out-Null

$클립 = Get-Clipboard -Raw
if ([string]::IsNullOrWhiteSpace($클립)) {
    Write-Host "클립보드가 비어 있습니다. 키를 복사한 뒤 다시 실행해 주세요." -ForegroundColor Yellow
    exit 1
}

# 여러 줄을 복사했어도, OPENROUTER_API_KEY= 가 붙어 있어도 키만 골라낸다.
$키 = $null
foreach ($줄 in ($클립 -split "`r?`n")) {
    $다듬음 = $줄.Trim()
    if ($다듬음 -match 'OPENROUTER_API_KEY\s*=\s*(.+)$') { $키 = $Matches[1].Trim(); break }
    if ($다듬음 -like 'sk-*') { $키 = $다듬음; break }
}
if (-not $키) { $키 = $클립.Trim() }
$키 = $키.Trim('"').Trim("'").Trim()

if ($키 -notlike 'sk-*') {
    Write-Host "복사된 것이 OpenRouter 키처럼 보이지 않습니다 (키는 sk- 로 시작합니다)." -ForegroundColor Yellow
    Write-Host "복사한 길이: $($키.Length)자. 키를 다시 복사한 뒤 이 스크립트를 다시 실행해 주세요."
    exit 1
}

$줄들 = Get-Content $envPath -Encoding UTF8
$찾음 = $false
$새줄들 = foreach ($줄 in $줄들) {
    if ($줄 -match '^\s*OPENROUTER_API_KEY\s*=') { $찾음 = $true; "OPENROUTER_API_KEY=$키" } else { $줄 }
}
if (-not $찾음) { $새줄들 += "OPENROUTER_API_KEY=$키" }
Set-Content -Path $envPath -Value $새줄들 -Encoding UTF8

$끝4 = $키.Substring([Math]::Max(0, $키.Length - 4))
Write-Host ""
Write-Host "넣었습니다: $envPath" -ForegroundColor Green
Write-Host "들어간 키: sk-...$끝4  (길이 $($키.Length)자)"
Write-Host "이제 http://localhost:3000 에서 한 줄 써 보세요."
