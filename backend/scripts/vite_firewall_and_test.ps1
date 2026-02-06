# Adds firewall rules for Vite and tests connectivity
netsh advfirewall firewall add rule name="Vite 5173" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="Vite 5174" dir=in action=allow protocol=TCP localport=5174

"=== Test results ===" | Out-File -FilePath C:\projects\temple\backend\scripts\vite_test_results.txt -Encoding utf8
Test-NetConnection -ComputerName 127.0.0.1 -Port 5173 | Select-Object ComputerName,RemoteAddress,RemotePort,TcpTestSucceeded | Out-File -FilePath C:\projects\temple\backend\scripts\vite_test_results.txt -Encoding utf8 -Append
Test-NetConnection -ComputerName 127.0.0.1 -Port 5174 | Select-Object ComputerName,RemoteAddress,RemotePort,TcpTestSucceeded | Out-File -FilePath C:\projects\temple\backend\scripts\vite_test_results.txt -Encoding utf8 -Append

"Done" | Out-File -FilePath C:\projects\temple\backend\scripts\vite_test_results.txt -Encoding utf8 -Append
