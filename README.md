## Printer Bluetooth

Step:
- Connect printer via bluetooth
- Open Control Panel -> Hardware and Sound -> Devices and Printers
- Righ-click printer (ex: RPP02N), select "Properties"
- Move tab "Services" wait until "Serial Port" appear (ex: COM7)
- Install app "POS Printer Driver Setup 58mm.exe"
- Select OS (windows 10), select printer "POS-58 Series Printer", ports (leave it blank), click "Begin Setup"
- After "POS-58 Properties" show, select tab "Ports", select serial port (in this case: COM7), uncheck "Enable printer pooling, click "Apply" & "OK"
- Install node v10.24.1
- Run command "npm i --force" or "npm ci --force" or just double click file "install.bat"
- Open "config.json" to set printer name (in this case: POS-58), paper size, merchant name, address and phone number 
- To change logo, replace "logo.png" to folder "assets".
- Run server use command "node app.js" or double click file "run.bat"
- Test request use postman or anything, documentation: https://documenter.getpostman.com/view/40686606/2sAYQZGXEM



## Printer USB

Step:
- Connect printer via usb
- Install app "POS Printer Driver Setup 58mm.exe"
- Select OS (windows 10), select printer "POS-58 Series Printer", ports (leave it blank), click "USB Port Check", click Begin Setup
- Install node v10.24.1
- Run command "npm i --force" or "npm ci --force" or just double click file "install.bat"
- Open "config.json" to set printer name (in this case: POS-58), paper size, merchant name, address and phone number 
- To change logo, replace "logo.png" to folder "assets".
- Run server use command "node app.js" or double click file "run.bat"
- If app cannot start, remove "node_modules" and "package-lock.json" then install again use command "npm i --force" or "npm ci --force"
- Test request use postman or anything, documentation: https://documenter.getpostman.com/view/40686606/2sAYQZGXEM
