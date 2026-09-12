$outputPath = Join-Path $PSScriptRoot "stylesbytiwa-app-summary.pdf"

function Escape-PdfText {
  param([string]$Text)
  return $Text.Replace("\", "\\").Replace("(", "\(").Replace(")", "\)")
}

$lines = @(
  @{ font = "F2"; size = 19; gap = 24; text = "Styles By Tiwa App Summary" },
  @{ font = "F1"; size = 9; gap = 18; text = "Repo-based one-page overview of the storefront and admin flow." },

  @{ font = "F2"; size = 11; gap = 18; text = "WHAT IT IS" },
  @{ font = "F1"; size = 9; gap = 11; text = "A static fashion storefront for Styles By Tiwa with a landing page, shop page," },
  @{ font = "F1"; size = 9; gap = 11; text = "and browser-based admin area. Product data, admin auth, and image storage use Supabase." },

  @{ font = "F2"; size = 11; gap = 18; text = "WHO IT IS FOR" },
  @{ font = "F1"; size = 9; gap = 11; text = "Primary persona: a small fashion brand owner who wants to showcase collections online," },
  @{ font = "F1"; size = 9; gap = 11; text = "take orders through WhatsApp, and manage products without a custom backend app." },

  @{ font = "F2"; size = 11; gap = 18; text = "WHAT IT DOES" },
  @{ font = "F1"; size = 9; gap = 11; text = "- Presents a branded homepage with hero, about, featured collection, and contact sections." },
  @{ font = "F1"; size = 9; gap = 11; text = "- Loads a shop grid from a Supabase products table." },
  @{ font = "F1"; size = 9; gap = 11; text = "- Lets shoppers filter products by category." },
  @{ font = "F1"; size = 9; gap = 11; text = "- Opens product details in a modal with image, title, price, and CTA." },
  @{ font = "F1"; size = 9; gap = 11; text = "- Routes purchase intent to WhatsApp with prefilled order text." },
  @{ font = "F1"; size = 9; gap = 11; text = "- Supports admin login with Supabase Auth and an allowed-email check." },
  @{ font = "F1"; size = 9; gap = 11; text = "- Lets the admin add, edit, delete, and image-upload products." },

  @{ font = "F2"; size = 11; gap = 18; text = "HOW IT WORKS" },
  @{ font = "F1"; size = 9; gap = 11; text = "UI: index.html, shop.html, login.html, and tiwa-admin-dashboard.html share style.css." },
  @{ font = "F1"; size = 9; gap = 11; text = "Client logic: script.js toggles nav; shop.js loads and filters products; admin.js handles auth and CRUD." },
  @{ font = "F1"; size = 9; gap = 11; text = "Services: Supabase JS CDN is used for auth, reads/writes to products, and uploads to product-images." },
  @{ font = "F1"; size = 9; gap = 11; text = "Flow: browser page -> JS creates Supabase client -> shop reads products and renders cards/modal ->" },
  @{ font = "F1"; size = 9; gap = 11; text = "admin authenticates, uploads images, and updates records -> shopper orders continue in WhatsApp." },
  @{ font = "F1"; size = 9; gap = 11; text = "Server code/API layer: Not found in repo." },

  @{ font = "F2"; size = 11; gap = 18; text = "HOW TO RUN" },
  @{ font = "F1"; size = 9; gap = 11; text = "1. Open index.html in a browser for the landing page." },
  @{ font = "F1"; size = 9; gap = 11; text = "2. Open shop.html for the catalog; internet access is needed for Supabase and CDN assets." },
  @{ font = "F1"; size = 9; gap = 11; text = "3. Open login.html for admin sign-in, then continue to tiwa-admin-dashboard.html." },
  @{ font = "F1"; size = 9; gap = 11; text = "4. Supabase schema setup, local dev server, package commands, and deployment steps: Not found in repo." },

  @{ font = "F1"; size = 8; gap = 18; text = "Evidence used: index.html, shop.html, login.html, tiwa-admin-dashboard.html, shop.js, admin.js, script.js, style.css." }
)

$streamParts = New-Object System.Collections.Generic.List[string]
$streamParts.Add("BT")
$streamParts.Add("/F2 19 Tf")
$streamParts.Add("54 806 Td")

$first = $true
foreach ($line in $lines) {
  $escaped = Escape-PdfText $line.text
  if ($first) {
    $streamParts.Add("($escaped) Tj")
    $first = $false
  } else {
    $streamParts.Add("0 -$($line.gap) Td")
    $streamParts.Add("/$($line.font) $($line.size) Tf")
    $streamParts.Add("($escaped) Tj")
  }
}
$streamParts.Add("ET")

$contentStream = ($streamParts -join "`n") + "`n"
$contentBytes = [System.Text.Encoding]::ASCII.GetBytes($contentStream)

$objects = @(
  "1 0 obj`n<< /Type /Catalog /Pages 2 0 R >>`nendobj`n",
  "2 0 obj`n<< /Type /Pages /Kids [3 0 R] /Count 1 >>`nendobj`n",
  "3 0 obj`n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`nendobj`n",
  "4 0 obj`n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`nendobj`n",
  "5 0 obj`n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`nendobj`n",
  "6 0 obj`n<< /Length $($contentBytes.Length) >>`nstream`n$contentStream" + "endstream`nendobj`n"
)

$builder = New-Object System.Text.StringBuilder
[void]$builder.Append("%PDF-1.4`n")

$offsets = New-Object System.Collections.Generic.List[int]
$offsets.Add(0)

foreach ($object in $objects) {
  $offsets.Add([System.Text.Encoding]::ASCII.GetByteCount($builder.ToString()))
  [void]$builder.Append($object)
}

$xrefOffset = [System.Text.Encoding]::ASCII.GetByteCount($builder.ToString())
[void]$builder.Append("xref`n")
[void]$builder.Append("0 7`n")
[void]$builder.Append("0000000000 65535 f `n")

for ($i = 1; $i -lt $offsets.Count; $i++) {
  [void]$builder.AppendFormat("{0:0000000000} 00000 n `n", $offsets[$i])
}

[void]$builder.Append("trailer`n")
[void]$builder.Append("<< /Size 7 /Root 1 0 R >>`n")
[void]$builder.Append("startxref`n")
[void]$builder.Append("$xrefOffset`n")
[void]$builder.Append("%%EOF")

[System.IO.File]::WriteAllBytes($outputPath, [System.Text.Encoding]::ASCII.GetBytes($builder.ToString()))
Write-Output $outputPath
