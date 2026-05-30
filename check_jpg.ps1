$f = [System.IO.File]::ReadAllBytes('C:\Users\ILMI\Pictures\Untitled.jpg')
$f[0..3] -join ','
$f.Length