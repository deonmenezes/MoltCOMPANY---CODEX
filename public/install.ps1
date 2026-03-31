$ErrorActionPreference = 'Stop'

$package = if ($env:MOLTCOMPANY_PACKAGE) { $env:MOLTCOMPANY_PACKAGE } else { 'moltcompany' }
$version = if ($env:MOLTCOMPANY_VERSION) { $env:MOLTCOMPANY_VERSION } else { 'latest' }
$target = if ($version -eq 'latest') { $package } else { "$package@$version" }

function Test-Tool {
  param([string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-With {
  param([string]$Manager)

  Write-Host "Installing $target with $Manager..."

  switch ($Manager) {
    'bun' { bun add -g $target }
    'pnpm' { pnpm add -g $target }
    'npm' { npm install -g $target }
    'yarn' { yarn global add $target }
  }
}

if (Test-Tool 'bun') {
  Install-With 'bun'
} elseif (Test-Tool 'pnpm') {
  Install-With 'pnpm'
} elseif (Test-Tool 'npm') {
  Install-With 'npm'
} elseif (Test-Tool 'yarn') {
  Install-With 'yarn'
} else {
  Write-Error "No supported package manager found. Install Node.js or Bun first, then run 'npm install -g $target'."
}

Write-Host ""
Write-Host "MoltCompany installed."
Write-Host "Try:"
Write-Host "  moltcompany --help"
Write-Host "  moltcompany prompt --source community --task-id 3 --title `"OpenClaw Intake Desk`" --role `"Agent onboarding operator`""
