# 런처 아이콘 생성기 (Windows 전용 — System.Drawing 을 쓴다)
#
# 원본: android/app/src/main/ic_launcher-playstore.png (512x512, 하늘색 배경이 깔린 정사각 로고)
# 하는 일: 테두리에서 번지는 채움으로 하늘 배경만 투명으로 빼고, 핀 로고만 잘라
#          밀도별로 여백을 두고 다시 배치한다.
#
# 배경 판정은 '가장 어두운 채널값 > 140'. 하늘은 제일 진한 곳이 153, 로고의 파랑/초록/주황은
# 73 이하라 이 선에서 깨끗하게 갈린다. 채도로 가르면 탑 모양의 옅은 선(sat 65)과
# 진한 하늘(sat 99)이 뒤집혀서 안 된다.
# 핀 안쪽의 흰 영역은 테두리에서 닿지 않아 살아남는다 — 그래서 단순 색 판정이 아니라 채움이다.
#
# 적응형 아이콘은 108dp 캔버스 중 가운데 72dp 만 보이므로 전경은 0.52 로 작게 깐다.
# iOS 는 알파 채널이 있으면 심사에서 걷어차므로 흰 배경에 눕혀 24bpp 로 저장한다.
#
# 실행: powershell -File scripts/gen-launcher-icons.ps1 <원본.png> <출력폴더>
#       결과를 android/app/src/main/res/mipmap-* 와
#       ios/chamApp/Images.xcassets/AppIcon.appiconset 으로 복사하면 된다.
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$src  = $args[0]
$out  = $args[1]

$bmp = New-Object System.Drawing.Bitmap $src
$W = $bmp.Width; $H = $bmp.Height
$rect = New-Object System.Drawing.Rectangle 0,0,$W,$H
$data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$stride = $data.Stride
$buf = New-Object byte[] ($stride * $H)
[System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $buf.Length)
$bmp.UnlockBits($data)
$bmp.Dispose()

# --- classify "sky": low saturation AND bright ---
$isSky = New-Object bool[] ($W * $H)
for ($y=0; $y -lt $H; $y++) {
  $row = $y * $stride
  for ($x=0; $x -lt $W; $x++) {
    $o = $row + $x*4
    $b = $buf[$o]; $g = $buf[$o+1]; $r = $buf[$o+2]
    $mx = [Math]::Max($r, [Math]::Max($g, $b))
    $mn = [Math]::Min($r, [Math]::Min($g, $b))
    if ($mn -gt 140) { $isSky[$y*$W + $x] = $true }
  }
}

# --- flood fill from the border so interior whites (inside the logo) survive ---
$vis = New-Object bool[] ($W * $H)
$stack = New-Object System.Collections.Generic.Stack[int]
for ($x=0; $x -lt $W; $x++) {
  foreach ($y in 0, ($H-1)) { $i = $y*$W+$x; if ($isSky[$i] -and -not $vis[$i]) { $vis[$i]=$true; $stack.Push($i) } }
}
for ($y=0; $y -lt $H; $y++) {
  foreach ($x in 0, ($W-1)) { $i = $y*$W+$x; if ($isSky[$i] -and -not $vis[$i]) { $vis[$i]=$true; $stack.Push($i) } }
}
while ($stack.Count -gt 0) {
  $i = $stack.Pop()
  $x = $i % $W; $y = [int](($i - $x) / $W)
  if ($x -gt 0)      { $j=$i-1;  if ($isSky[$j] -and -not $vis[$j]) { $vis[$j]=$true; $stack.Push($j) } }
  if ($x -lt $W-1)   { $j=$i+1;  if ($isSky[$j] -and -not $vis[$j]) { $vis[$j]=$true; $stack.Push($j) } }
  if ($y -gt 0)      { $j=$i-$W; if ($isSky[$j] -and -not $vis[$j]) { $vis[$j]=$true; $stack.Push($j) } }
  if ($y -lt $H-1)   { $j=$i+$W; if ($isSky[$j] -and -not $vis[$j]) { $vis[$j]=$true; $stack.Push($j) } }
}

# --- alpha = 0 on background, then 3x3 average to soften the cut edge ---
$alpha = New-Object byte[] ($W * $H)
for ($i=0; $i -lt $W*$H; $i++) { if ($vis[$i]) { $alpha[$i] = 0 } else { $alpha[$i] = 255 } }
$soft = New-Object byte[] ($W * $H)
for ($y=0; $y -lt $H; $y++) {
  for ($x=0; $x -lt $W; $x++) {
    $s=0; $n=0
    for ($dy=-1; $dy -le 1; $dy++) {
      $yy = $y+$dy; if ($yy -lt 0 -or $yy -ge $H) { continue }
      for ($dx=-1; $dx -le 1; $dx++) {
        $xx = $x+$dx; if ($xx -lt 0 -or $xx -ge $W) { continue }
        $s += $alpha[$yy*$W+$xx]; $n++
      }
    }
    $soft[$y*$W+$x] = [byte]([int]($s/$n))
  }
}
for ($y=0; $y -lt $H; $y++) {
  $row = $y*$stride
  for ($x=0; $x -lt $W; $x++) { $buf[$row + $x*4 + 3] = $soft[$y*$W+$x] }
}

# --- bounding box of what is left ---
$minX=$W; $minY=$H; $maxX=-1; $maxY=-1
for ($y=0; $y -lt $H; $y++) {
  for ($x=0; $x -lt $W; $x++) {
    if ($soft[$y*$W+$x] -gt 24) {
      if ($x -lt $minX){$minX=$x}; if ($x -gt $maxX){$maxX=$x}
      if ($y -lt $minY){$minY=$y}; if ($y -gt $maxY){$maxY=$y}
    }
  }
}
$cw = $maxX-$minX+1; $ch = $maxY-$minY+1
Write-Output ("logo bbox = ({0},{1}) {2}x{3}  = {4:N1}% x {5:N1}% of canvas" -f $minX,$minY,$cw,$ch,(100*$cw/$W),(100*$ch/$H))

# --- rebuild a transparent-background bitmap, cropped to the logo ---
$full = New-Object System.Drawing.Bitmap $W,$H,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$fd = $full.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
[System.Runtime.InteropServices.Marshal]::Copy($buf, 0, $fd.Scan0, $buf.Length)
$full.UnlockBits($fd)
$logo = $full.Clone((New-Object System.Drawing.Rectangle $minX,$minY,$cw,$ch), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$full.Dispose()
$logo.Save((Join-Path $out 'logo-cut.png'), [System.Drawing.Imaging.ImageFormat]::Png)

# --- draw the logo centred on a canvas, occupying `fill` of the shorter side ---
function Render([int]$size, [double]$fill, [string]$bg, [bool]$circle, [string]$path) {
  $c = New-Object System.Drawing.Bitmap $size,$size,([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($c)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  if ($bg -ne '') {
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($bg))
    if ($circle) { $g.FillEllipse($brush, 0, 0, $size-1, $size-1) } else { $g.FillRectangle($brush, 0, 0, $size, $size) }
    $brush.Dispose()
  }
  $target = $size * $fill
  $scale = [Math]::Min($target / $logo.Width, $target / $logo.Height)
  $dw = $logo.Width * $scale; $dh = $logo.Height * $scale
  $g.DrawImage($logo, [float](($size-$dw)/2), [float](($size-$dh)/2), [float]$dw, [float]$dh)
  $g.Dispose()
  $c.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $c.Dispose()
}

# Android legacy (API 24-25) + adaptive foreground (108dp canvas, centre 66.7% visible)
$legacy = @{ 'mdpi'=48; 'hdpi'=72; 'xhdpi'=96; 'xxhdpi'=144; 'xxxhdpi'=192 }
$fore   = @{ 'mdpi'=108; 'hdpi'=162; 'xhdpi'=216; 'xxhdpi'=324; 'xxxhdpi'=432 }
foreach ($d in $legacy.Keys) {
  $dir = Join-Path $out "mipmap-$d"
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Render $legacy[$d]  0.86 ''        $false (Join-Path $dir 'ic_launcher.png')
  Render $legacy[$d]  0.62 '#FFFFFF' $true  (Join-Path $dir 'ic_launcher_round.png')
  Render $fore[$d]    0.52 ''        $false (Join-Path $dir 'ic_launcher_foreground.png')
}

# iOS: flattened on white, no alpha channel allowed by the App Store
$ios = @{ '20@2x'=40; '20@3x'=60; '29@2x'=58; '29@3x'=87; '40@2x'=80; '40@3x'=120; '60@2x'=120; '60@3x'=180; '1024'=1024 }
$iosDir = Join-Path $out 'AppIcon.appiconset'
New-Item -ItemType Directory -Force -Path $iosDir | Out-Null
foreach ($k in $ios.Keys) {
  $p = Join-Path $iosDir "icon-$k.png"
  Render $ios[$k] 0.72 '#FFFFFF' $false $p
  # strip alpha by redrawing onto a 24bpp surface
  $t = New-Object System.Drawing.Bitmap $p
  $flat = New-Object System.Drawing.Bitmap $t.Width,$t.Height,([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $gg = [System.Drawing.Graphics]::FromImage($flat)
  $gg.Clear([System.Drawing.Color]::White); $gg.DrawImage($t, 0, 0, $t.Width, $t.Height); $gg.Dispose()
  $t.Dispose()
  $flat.Save($p, [System.Drawing.Imaging.ImageFormat]::Png); $flat.Dispose()
}

# a large preview so the result can be eyeballed before it lands in the repo
Render 432 0.52 '#FFFFFF' $false (Join-Path $out 'preview-adaptive-safe.png')
Render 432 0.52 '#FFFFFF' $true  (Join-Path $out 'preview-adaptive-masked.png')
$logo.Dispose()
Write-Output 'done'
