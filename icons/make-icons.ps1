Add-Type -AssemblyName System.Drawing

function New-ClockIcon {
    param(
        [int]$Size,
        [string]$Path
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear([System.Drawing.Color]::Transparent)

    $cx = $Size / 2.0
    $cy = $Size / 2.0
    $pad = [Math]::Max(1, [int]($Size * 0.06))
    $radius = ($Size / 2.0) - $pad

    # Face
    $faceRect = New-Object System.Drawing.RectangleF(($cx - $radius), ($cy - $radius), ($radius * 2), ($radius * 2))
    $faceBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 37, 99, 235))
    $g.FillEllipse($faceBrush, $faceRect)
    $faceBrush.Dispose()

    # Inner face (lighter ring)
    $innerR = $radius * 0.86
    $innerRect = New-Object System.Drawing.RectangleF(($cx - $innerR), ($cy - $innerR), ($innerR * 2), ($innerR * 2))
    $innerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 247, 250))
    $g.FillEllipse($innerBrush, $innerRect)
    $innerBrush.Dispose()

    # Outer border for crispness
    $borderWidth = [Math]::Max(1, $Size * 0.03)
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 26, 31, 44), [float]$borderWidth)
    $g.DrawEllipse($borderPen, $faceRect)
    $borderPen.Dispose()

    # Hour ticks (12)
    $tickColor = [System.Drawing.Color]::FromArgb(255, 26, 31, 44)
    $tickPen = New-Object System.Drawing.Pen($tickColor, [float]([Math]::Max(1, $Size * 0.04)))
    for ($i = 0; $i -lt 12; $i++) {
        $angle = ($i * 30 - 90) * [Math]::PI / 180.0
        $outerX = $cx + ([Math]::Cos($angle) * $innerR)
        $outerY = $cy + ([Math]::Sin($angle) * $innerR)
        $tickLen = if ($i % 3 -eq 0) { $innerR * 0.20 } else { $innerR * 0.10 }
        $innerX = $cx + ([Math]::Cos($angle) * ($innerR - $tickLen))
        $innerY = $cy + ([Math]::Sin($angle) * ($innerR - $tickLen))
        if ($Size -ge 32 -or ($i % 3 -eq 0)) {
            $g.DrawLine($tickPen, [float]$innerX, [float]$innerY, [float]$outerX, [float]$outerY)
        }
    }
    $tickPen.Dispose()

    # Hour hand (pointing to ~10 — readable on tiny sizes)
    $hourHandPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 26, 31, 44), [float]([Math]::Max(1.5, $Size * 0.08)))
    $hourHandPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $hourHandPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $hourAngle = (300 - 90) * [Math]::PI / 180.0   # 10 o'clock
    $hourLen = $innerR * 0.5
    $hx = $cx + ([Math]::Cos($hourAngle) * $hourLen)
    $hy = $cy + ([Math]::Sin($hourAngle) * $hourLen)
    $g.DrawLine($hourHandPen, [float]$cx, [float]$cy, [float]$hx, [float]$hy)
    $hourHandPen.Dispose()

    # Minute hand (pointing to ~2)
    $minHandPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 26, 31, 44), [float]([Math]::Max(1, $Size * 0.055)))
    $minHandPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $minHandPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $minAngle = (60 - 90) * [Math]::PI / 180.0   # 2 o'clock
    $minLen = $innerR * 0.72
    $mx = $cx + ([Math]::Cos($minAngle) * $minLen)
    $my = $cy + ([Math]::Sin($minAngle) * $minLen)
    $g.DrawLine($minHandPen, [float]$cx, [float]$cy, [float]$mx, [float]$my)
    $minHandPen.Dispose()

    # Center pin
    $pinR = [Math]::Max(1.0, $Size * 0.06)
    $pinRect = New-Object System.Drawing.RectangleF(($cx - $pinR), ($cy - $pinR), ($pinR * 2), ($pinR * 2))
    $pinBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 37, 99, 235))
    $g.FillEllipse($pinBrush, $pinRect)
    $pinBrush.Dispose()
    $pinOutline = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 26, 31, 44), [float]([Math]::Max(1, $Size * 0.02)))
    $g.DrawEllipse($pinOutline, $pinRect)
    $pinOutline.Dispose()

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
New-ClockIcon -Size 16  -Path (Join-Path $here "icon16.png")
New-ClockIcon -Size 32  -Path (Join-Path $here "icon32.png")
New-ClockIcon -Size 48  -Path (Join-Path $here "icon48.png")
New-ClockIcon -Size 128 -Path (Join-Path $here "icon128.png")
Write-Output "Icons generated."
