param([string]$OutputRoot)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$env:PYTHONUTF8 = '1'
python "$PSScriptRoot/prepare.py" $OutputRoot
if ($LASTEXITCODE -ne 0) { throw 'Payload preparation failed' }
$stage = Join-Path $OutputRoot 'HeroTournament-Windows-r12'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (!(Test-Path $compiler)) { throw 'The existing .NET Framework compiler is unavailable' }
& $compiler /nologo /target:winexe /platform:x64 /codepage:65001 /optimize+ /reference:System.dll /reference:System.Core.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll /reference:System.Web.Extensions.dll "/reference:$stage/Microsoft.Web.WebView2.Core.dll" "/reference:$stage/Microsoft.Web.WebView2.WinForms.dll" "/out:$stage/HeroTournament.exe" "$stage/Launcher.cs" "$OutputRoot/BuildStamp.cs"
if ($LASTEXITCODE -ne 0 -or !(Test-Path "$stage/HeroTournament.exe")) { throw 'Native compilation failed' }
& "$stage/runtime/node.exe" "$PSScriptRoot/engine-check.mjs" $stage "$OutputRoot/baseline-game" "$OutputRoot/engine-verification.json"
if ($LASTEXITCODE -ne 0) { throw 'Integrated engine regression failed' }
function Run-Native([string]$Mode, [int]$TimeoutMs) {
    $process = Start-Process -FilePath "$stage/HeroTournament.exe" -ArgumentList $Mode -WorkingDirectory $stage -PassThru
    if (!$process.WaitForExit($TimeoutMs)) { $process.Kill(); throw "Native test timed out: $Mode" }
    $process.Refresh()
    $code = $process.ExitCode
    if ($null -eq $code -or $code -ne 0) { throw "Native test failed: $Mode (exit $code)" }
}
Run-Native '--verify-only' 60000
# A changed runtime file must fail before the server or browser starts.
$negative = Join-Path $stage 'game/resource-rules.js'
$original = [IO.File]::ReadAllBytes($negative)
try {
    [IO.File]::AppendAllText($negative, "`n// integrity negative control`n")
    $process = Start-Process -FilePath "$stage/HeroTournament.exe" -ArgumentList '--verify-only' -PassThru
    if (!$process.WaitForExit(60000)) { $process.Kill(); throw 'Integrity negative timed out' }
    $process.Refresh()
    if ($process.ExitCode -ne 2) { throw 'Tampered payload was not rejected' }
} finally { [IO.File]::WriteAllBytes($negative, $original) }
Run-Native '--verify-only' 60000
Run-Native '--smoke-test' 120000
foreach ($mode in @('--learning-playtest', '--room-playtest', '--playtest')) {
    $before = @(Get-ChildItem "$stage/playtest-evidence" -Directory -ErrorAction SilentlyContinue | ForEach-Object Name)
    Run-Native $mode 600000
    $fresh = @(Get-ChildItem "$stage/playtest-evidence" -Directory | Where-Object { $_.Name -notin $before })
    if ($fresh.Count -ne 1) { throw "Missing unique actual native evidence: $mode" }
    $resultPath = Join-Path $fresh[0].FullName 'result.json'
    if (!(Test-Path $resultPath)) { throw "Native result missing: $mode" }
    $result = Get-Content $resultPath -Raw | ConvertFrom-Json
    if ($result.type -ne 'complete' -or $result.detail.result -ne 'PASS') { throw "Native result did not pass: $mode" }
    $images = @(Get-ChildItem $fresh[0].FullName -Filter '*.png')
    if ($images.Count -lt 5) { throw "Native screenshots missing: $mode" }
}
python "$PSScriptRoot/finalize.py" $OutputRoot
if ($LASTEXITCODE -ne 0) { throw 'Final package verification failed' }
