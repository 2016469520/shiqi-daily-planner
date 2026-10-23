# 从 ShiQi 1024px 母图派生全部图标资源（Electron / PWA / Android）。
# 用法：powershell -File scripts\generate-icons.ps1 -Master <1024.png> [-Ico <ShiQi.ico>] [-Root <仓库根目录>]
param(
  [Parameter(Mandatory = $true)][string]$Master,
  [string]$Ico,
  [string]$Root = (Split-Path $PSScriptRoot -Parent)
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function New-Canvas([int]$w, [int]$h) {
  New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function New-Graphics($bmp) {
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g
}

# 逐级减半再收尾，避免大幅缩小时的采样失真
function Shrink([System.Drawing.Bitmap]$img, [int]$target) {
  $cur = $img
  while ([int]($cur.Width / 2) -ge $target) {
    $nw = [int]($cur.Width / 2)
    $nb = New-Canvas $nw $nw
    $g = New-Graphics $nb
    $g.DrawImage($cur, 0, 0, $nw, $nw)
    $g.Dispose()
    if (-not [object]::ReferenceEquals($cur, $img)) { $cur.Dispose() }
    $cur = $nb
  }
  if ($cur.Width -ne $target) {
    $nb = New-Canvas $target $target
    $g = New-Graphics $nb
    $g.DrawImage($cur, 0, 0, $target, $target)
    $g.Dispose()
    if (-not [object]::ReferenceEquals($cur, $img)) { $cur.Dispose() }
    $cur = $nb
  }
  $cur
}

function Save-Png($bmp, [string]$path) {
  $dir = Split-Path $path -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host ("  " + $path)
}

# 沿坐标轴从外向内找第一个不透明像素，取其颜色（对圆角半径不敏感）
function First-Opaque-Color([System.Drawing.Bitmap]$bmp, [int]$x, [int]$y, [int]$dx, [int]$dy) {
  while ($x -ge 0 -and $x -lt $bmp.Width -and $y -ge 0 -and $y -lt $bmp.Height) {
    $c = $bmp.GetPixel($x, $y)
    if ($c.A -ge 250) { return $c }
    $x += $dx; $y += $dy
  }
  $null
}

$src = [System.Drawing.Bitmap]::FromFile($Master)
if ($src.Width -ne $src.Height) { throw "master icon must be square, got $($src.Width)x$($src.Height)" }
$N = $src.Width
$mid = [int]($N / 2)

$top = First-Opaque-Color $src $mid 0 0 1
$bottom = First-Opaque-Color $src $mid ($N - 1) 0 -1
$left = First-Opaque-Color $src 0 $mid 1 0
$right = First-Opaque-Color $src ($N - 1) $mid -1 0
if (-not $top -or -not $bottom -or -not $left -or -not $right) { throw "failed to sample edge colors" }

$bgR = [int](($top.R + $bottom.R + $left.R + $right.R) / 4)
$bgG = [int](($top.G + $bottom.G + $left.G + $right.G) / 4)
$bgB = [int](($top.B + $bottom.B + $left.B + $right.B) / 4)
$bg = [System.Drawing.Color]::FromArgb(255, $bgR, $bgG, $bgB)
$bgHex = ('#{0:X2}{1:X2}{2:X2}' -f $bgR, $bgG, $bgB)
Write-Host "sampled launcher background: $bgHex (top $($top.Name) / bottom $($bottom.Name))"

Write-Host "== plain resized icons (rounded corners kept transparent) =="
foreach ($s in 48, 72, 96, 144, 192, 512) {
  $b = Shrink $src $s
  Save-Png $b (Join-Path $Root "resources\icons\icon-$s.png")
  if ($s -eq 192 -or $s -eq 512) { Save-Png $b (Join-Path $Root "public\icon-$s.png") }
  $b.Dispose()
}

Write-Host "== android launcher icons =="
$densities = @(
  @{ dir = 'mipmap-mdpi'; s = 48 }, @{ dir = 'mipmap-hdpi'; s = 72 },
  @{ dir = 'mipmap-xhdpi'; s = 96 }, @{ dir = 'mipmap-xxhdpi'; s = 144 },
  @{ dir = 'mipmap-xxxhdpi'; s = 192 }
)
$res = Join-Path $Root 'android\app\src\main\res'
foreach ($d in $densities) {
  $s = $d.s
  $icon = Shrink $src $s

  # 传统方形：底色铺满，图标叠加（自带圆角露出底色）
  $sq = New-Canvas $s $s
  $g = New-Graphics $sq
  $g.Clear($bg)
  $g.DrawImage($icon, 0, 0, $s, $s)
  $g.Dispose()
  Save-Png $sq (Join-Path $res "$($d.dir)\ic_launcher.png")
  $sq.Dispose()

  # 圆形：圆形底色 + 圆形裁剪
  $rd = New-Canvas $s $s
  $g = New-Graphics $rd
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse(0, 0, $s, $s)
  $g.SetClip($path)
  $g.Clear($bg)
  $g.DrawImage($icon, 0, 0, $s, $s)
  $g.Dispose()
  $path.Dispose()
  Save-Png $rd (Join-Path $res "$($d.dir)\ic_launcher_round.png")
  $rd.Dispose()

  # 自适应前景：1.5 倍画布，图标占 58%（留在 61% 安全区内），四周透明
  $f = [int]($s * 1.5)
  $inner = [int]($f * 0.58)
  $fgIcon = Shrink $src $inner
  $fg = New-Canvas $f $f
  $g = New-Graphics $fg
  $g.DrawImage($fgIcon, [int](($f - $inner) / 2), [int](($f - $inner) / 2), $inner, $inner)
  $g.Dispose()
  Save-Png $fg (Join-Path $res "$($d.dir)\ic_launcher_foreground.png")
  $fg.Dispose()
  $fgIcon.Dispose()
  $icon.Dispose()
}

Write-Host "== android adaptive background color =="
@'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">__HEX__</color>
</resources>
'@.Replace('__HEX__', $bgHex) | Set-Content -Encoding UTF8 (Join-Path $res 'values\ic_launcher_background.xml')
Write-Host ("  " + (Join-Path $res 'values\ic_launcher_background.xml'))

Write-Host "== android splash screens =="
$splashes = @(
  @{ dir = 'drawable'; w = 480; h = 320 },
  @{ dir = 'drawable-land-mdpi'; w = 480; h = 320 },
  @{ dir = 'drawable-land-hdpi'; w = 800; h = 480 },
  @{ dir = 'drawable-land-xhdpi'; w = 1280; h = 720 },
  @{ dir = 'drawable-land-xxhdpi'; w = 1600; h = 960 },
  @{ dir = 'drawable-land-xxxhdpi'; w = 1920; h = 1280 },
  @{ dir = 'drawable-port-mdpi'; w = 320; h = 480 },
  @{ dir = 'drawable-port-hdpi'; w = 480; h = 800 },
  @{ dir = 'drawable-port-xhdpi'; w = 720; h = 1280 },
  @{ dir = 'drawable-port-xxhdpi'; w = 960; h = 1600 },
  @{ dir = 'drawable-port-xxxhdpi'; w = 1280; h = 1920 }
)
foreach ($sp in $splashes) {
  $w = $sp.w; $h = $sp.h
  $size = [int]([Math]::Min($w, $h) * 0.40)
  $logo = Shrink $src $size
  $bmp = New-Canvas $w $h
  $g = New-Graphics $bmp
  $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $top, $bottom, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
  $g.FillRectangle($brush, $rect)
  $brush.Dispose()
  $g.DrawImage($logo, [int](($w - $size) / 2), [int](($h - $size) / 2), $size, $size)
  $g.Dispose()
  Save-Png $bmp (Join-Path $res "$($sp.dir)\splash.png")
  $bmp.Dispose()
  $logo.Dispose()
}

Write-Host "== electron / favicon ico =="
if ($Ico -and (Test-Path $Ico)) {
  Copy-Item $Ico (Join-Path $Root 'resources\icon.ico') -Force
  Copy-Item $Ico (Join-Path $Root 'src\app\favicon.ico') -Force
  Write-Host "  resources\icon.ico + src\app\favicon.ico"
} else {
  Write-Warning "no -Ico given, skipped"
}

$src.Dispose()
Write-Host "done."

