param(
  [string]$Source = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [string]$Repository = 'https://github.com/paulinrab-a11y/ohccatalogosbr.git',
  [string]$Branch = 'fix/ohc-integrado-preview-20260928'
)

$ErrorActionPreference = 'Stop'
$work = Join-Path $env:TEMP ('ohc-preview-' + [guid]::NewGuid().ToString('N'))

try {
  Write-Host '1/5 - Clonando o repositório remoto em pasta temporária...'
  git clone --depth 1 $Repository $work
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao clonar o repositório.' }

  Set-Location $work
  git switch -c $Branch
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar a branch de preview.' }

  Write-Host '2/5 - Substituindo SOMENTE a branch de preview pelo projeto OHC validado...'
  Get-ChildItem -Force | Where-Object { $_.Name -ne '.git' } | Remove-Item -Recurse -Force

  $excludeDirs = @('node_modules','dist','.vercel','.git','playwright-report','test-results','evidence','patches')
  $excludeFiles = @('.env','.env.local','.env.production','.env.supabase-local','.env.ohc-local-secrets','OHC-AUDITORIA-FASE2-20260925-120912.txt','PACOTE.json','COMMITS.txt')

  $xd = @(); foreach ($d in $excludeDirs) { $xd += @('/XD', (Join-Path $Source $d)) }
  $xf = @(); foreach ($f in $excludeFiles) { $xf += @('/XF', (Join-Path $Source $f)) }

  & robocopy $Source $work /E /COPY:DAT /DCOPY:DAT /R:1 /W:1 /NFL /NDL /NJH /NJS /NP @xd @xf | Out-Null
  if ($LASTEXITCODE -gt 7) { throw "Robocopy falhou com código $LASTEXITCODE." }

  Set-Location $work
  git add -A

  Write-Host '3/5 - Conferindo segredos antes do commit...'
  
  $envTracked = git ls-files | Where-Object { $_ -match '^\.env($|\.)' -and $_ -ne '.env.example' }
  if ($envTracked) {
    throw 'Arquivo .env real entrou no commit. Operação interrompida.'
  }
  if (-not (Test-Path '.\vercel.json')) { throw 'vercel.json não encontrado.' }
  if (-not (Test-Path '.\package.json')) { throw 'package.json não encontrado.' }

  Write-Host '4/5 - Criando commit da branch de preview...'
  git -c user.name='OHC Preview' -c user.email='preview@ohcmotorsbr.com.br' commit -m 'fix: integrar projeto OHC auditado para preview'
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar o commit.' }

  Write-Host '5/5 - Enviando branch. Isso NÃO altera a branch main nem a produção diretamente.'
  git push -u origin $Branch
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao enviar a branch.' }

  Write-Host ''
  Write-Host 'PREVIEW ENVIADO COM SUCESSO'
  Write-Host "Branch: $Branch"
  Write-Host 'A Vercel deverá criar um Preview a partir desta branch.'
  Write-Host 'Não faça merge em main ainda.'
}
finally {
  Set-Location $Source
  if (Test-Path $work) { Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue }
}
