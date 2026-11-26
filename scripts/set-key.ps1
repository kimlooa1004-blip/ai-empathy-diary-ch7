# .env의 OPENROUTER_API_KEY 줄에 키를 넣어 주는 도우미.
# 키는 가려져 입력되고 화면에도 끝 4글자만 보인다. 대화창에 붙여 넣을 필요가 없다.
#
# 쓰는 법:  powershell -ExecutionPolicy Bypass -File D:\study_06\scripts\set-key.ps1

$envPath = Join-Path $PSScriptRoot '..\.env'
$envPath = [System.IO.Path]::GetFullPath($envPath)

if (-not (Test-Path $envPath)) {
    $보기 = Join-Path $PSScriptRoot '..\.env.example'
    Copy-Item $보기 $envPath
    Write-Host ".env가 없어 .env.example에서 새로 만들었습니다."
}

$가린키 = Read-Host "OpenRouter 키를 붙여 넣고 Enter (화면에 보이지 않습니다)" -AsSecureString
$포인터 = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($가린키)
try {
    $키 = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($포인터)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($포인터)
}

$키 = $키.Trim()
if ([string]::IsNullOrWhiteSpace($키)) {
    Write-Host "아무것도 입력되지 않았습니다. 그만둡니다." -ForegroundColor Yellow
    exit 1
}

$줄들 = Get-Content $envPath -Encoding UTF8
$찾음 = $false
$새줄들 = foreach ($줄 in $줄들) {
    if ($줄 -match '^\s*OPENROUTER_API_KEY\s*=') {
        $찾음 = $true
        "OPENROUTER_API_KEY=$키"
    } else {
        $줄
    }
}
if (-not $찾음) { $새줄들 += "OPENROUTER_API_KEY=$키" }

Set-Content -Path $envPath -Value $새줄들 -Encoding UTF8

$끝4 = $키.Substring([Math]::Max(0, $키.Length - 4))
Write-Host ""
Write-Host "넣었습니다: $envPath" -ForegroundColor Green
Write-Host "들어간 키의 끝 4글자: $끝4  (길이 $($키.Length)자)"
Write-Host "개발 서버가 켜져 있으면 알아서 다시 읽습니다. http://localhost:3000 에서 한 줄 써 보세요."
