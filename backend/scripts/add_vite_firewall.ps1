# Adds permanent firewall rules for Vite dev ports
netsh advfirewall firewall add rule name="Vite Dev 5173" dir=in action=allow protocol=TCP localport=5173 profile=any
netsh advfirewall firewall add rule name="Vite Dev 5174" dir=in action=allow protocol=TCP localport=5174 profile=any
netsh advfirewall firewall add rule name="Vite Dev 3000" dir=in action=allow protocol=TCP localport=3000 profile=any
Write-Output "Firewall rules added."