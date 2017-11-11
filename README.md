# Install on Raspberry Pi

Make sure you have git and Node.js >=6.0.0 installed on your pi.

```bash
sudo apt-get update
sudo apt-get install wiringpi
git clone https://github.com/CommonGarden/Grow-Hub
cd Grow-Hub/driver
npm install
sudo node Grow-Hub.js
```

# Hardware setup / Bill of materials.

# Control Box
Inside Control box:
![Inside Control box](https://user-images.githubusercontent.com/3916616/31311864-302a24d2-ab6a-11e7-9593-81c027f5dcda.jpg)

Item             | Quantity | Cost | Link
-----------------|----------|------|------------------------------
Raspberry Pi Model 3B   | 1  | $35  | https://www.adafruit.com/product/3055?src=raspberrypi
Micro USB Power Supply - 2.5A w Switch | 1 | $9.90 | https://www.amazon.com/Eleduino-Raspberry-Supply-Adapter-Charger/dp/B01DP6NSW2
MicroSD Card - 16GB | 1 | $7.98 | https://www.amazon.com/SanDisk-16GB-Micro-SDHC-Memory/dp/B004G605OA/
2x20Pin Stacking Header | 2 | $2.60 | https://www.amazon.com/Extra-Female-Stacking-Header-Raspberry/dp/B01IRRCEBK/
Nylon Standoffs | 20pieces | $0.004 | https://www.amazon.com/Generic-Spacer-Assorted-Raspberry-Pi-Standoff/dp/B014J1ZLD6
3-Channel Relay Board for RPi| 1 | $23.99 | https://www.amazon.com/Waveshare-Board-Relay-Appliances-Intelligent/dp/B01FZ7XLJ4
AC Outlet Receptacles | 2 | $0.71 | http://www.homedepot.com/p/Leviton-15-Amp-Duplex-Outlet-White-R52-05320-00W/202066670
Outlet Box - 2-gang | 1 | $2.31 | http://www.homedepot.com/p/2-Gang-25-cu-in-Non-Metallic-Old-Work-Switch-and-Outlet-Box-B225R-UPC/100404169
Enclosure - 3"x6"x9" | 1 | $11 | https://www.amazon.com/OUTDOOR-CABLETEK-ENCLOSURE-UTILITY-CABLE/dp/B00BMVV758/
AC Power Cord | 1 | $2.99 | https://www.amazon.com/Generic-gss-Universal-Standard-Connector/dp/B00F0UO11Y/
Terminal Strip - 20A | 1/10th pack | $1.10 | https://www.amazon.com/Connector-Screw-Terminal-Barrier-Block/dp/B00NQB718E/
Air Temperature & Relative Humidity Sensor (AM2320) | 1 | $1.45 |  https://www.aliexpress.com/item/1pcs-AM2320-digital-temperature-and-humidity-sensor-AM2320B-replace-SHT10-SHT11-series/32818920611.html
Temperature Probe (Pt100, RTD type) | 1 | $0.97 | https://www.aliexpress.com/item/Waterproof-PT100-Platinum-Resister-Temperature-Sensor-Temp-Probe-free-shipping/32385652607.html
Pt100 Interface Board (MAX31865) | 1 | $7.01 | https://www.aliexpress.com/item/CJMCU-31865-MAX31865-RTD-platinum-resistance-temperature-detector-PT100-to-PT1000/32821269399.html
DuPont F/F Jumper Wires | 10 | $0.30 (total) | https://www.aliexpress.com/item/40PCS-LOT-10CM-1P-1P-40P-2-54mm-Dupont-Cable-Female-to-Female-Colorful-Dupont-Jumper/2024402290.html
Tentacle T3 Board | 1 | $91 | https://www.whiteboxes.ch/shop/tentacle-t3-for-raspberry-pi/
pH Probe | 1 | $7.39 | https://www.aliexpress.com/item/New-Arrival-PH-Electrode-Probe-BNC-Connector-for-Aquarium-PH-Controller-Meter-Sensor-gib-Best-Promotion/32781193789.html
Atlas Scientific pH Interface Board | 1 | $38 | https://www.atlas-scientific.com/product_pages/circuits/ezo_ph.html
Oxidation-Reduction Potential (ORP) Probe | 1 | $41.95 | https://www.amazon.com/gp/product/B007Z4GBSY/
Atlas Scientific ORP Interface Board | 1 | $38 | https://www.atlas-scientific.com/product_pages/circuits/ezo_orp.html
Atlas Scientific Dissolved Oxygen (DO) Probe | 1 | $198 | https://www.atlas-scientific.com/product_pages/probes/do_probe.html
Atlas Scientific DO Interface Board | 1 | $44 | https://www.atlas-scientific.com/product_pages/circuits/ezo_do.html


# Actuators
Item             | Quantity | Cost | Link
-----------------|----------|------|------------------------------
12VDC 2A Power Supply | 2 | $3.28 | https://www.aliexpress.com/item/YNL-EU-US-Plug-Power-Adapter-1A-2A-AC-110V-240V-to-DC-12V-for-3528/32815841532.html
DC Barrel Jack Adapter | 2 | $0.31 | https://www.aliexpress.com/item/10pcs-2-1x5-5mm-female-DC-Power-Jack-Adapter-Plug-Cable-Connector-for-CCTV-CAMERA/719733574.html
Fermwrap 40W Fermentation Heater | 1 | $23.95 | https://www.amazon.com/dp/B00TP9MLFE/
Water Pump (circulation) | 1 | $19.99 | https://www.amazon.com/bayite-BYT-7A006-Circulation-Discharge-2-1GPM/dp/B0196WL55G/

# Vessel
Fermenter:
![Fermenter](https://user-images.githubusercontent.com/3916616/31311866-302be5d8-ab6a-11e7-9963-6187714b8f64.jpg)

Item             | Quantity | Cost | Link
-----------------|----------|------|------------------------------
Fermonster 7Gal PET Carboy | 1 | $29.99 | https://www.morebeer.com/products/fermonster-7-gallon-carboy.html
Airlock | 1 | $1.99 | https://www.morebeer.com/products/airlock-3-piece.html
Thermowell w #10 Stopper | 1 | $13.99 | https://www.amazon.com/gp/product/B01KP4D0K2/
Stainless Steel Bulkhead | 2 | $9.25 | https://www.amazon.com/Learn-To-Brew-LLC-B00JHM38RE/dp/B00JHM38RE/
Bazooka Screen | 1 | $8.88 | https://www.amazon.com/Bazooka-Screen-MRbrew-Stainless-Kettle/dp/B07122LN4K/
3/4" PVC Pipe | 6" | ? | http://www.homedepot.com/p/JM-eagle-3-4-in-x-10-ft-480-PSI-Schedule-40-PVC-Plain-End-Pipe-57471/202280935
PVC Union - 3/4" FPT/FPT | 1 | $3.85 | http://www.homedepot.com/p/Homewerks-Worldwide-3-4-in-PVC-FPT-x-FPT-Union-511-44-34-34H/204202889
PVC Union - 1/2" FPT/FPT | 2 | $2.51 | http://www.homedepot.com/p/Homewerks-Worldwide-1-2-in-PVC-FPT-x-FPT-Union-511-44-12-12H/204202887
PVC Union - 1/2" Slip/Slip | 1 | $2.64 | http://www.homedepot.com/p/Homewerks-Worldwide-1-2-in-PVC-Slip-x-Slip-Union-511-14-12-12H/204202875
PVC 90 Elbow - 3/4" x 1/2" Slip/Slip | 1 | $0.79 | http://www.homedepot.com/p/DURA-3-4-in-x-1-2-in-Schedule-40-PVC-90-Degree-Reducing-Elbow-C406-101/100345769
PVC Bushing - 3/4" x 1/2" Slip/FPT | 1 | $0.79 | http://www.homedepot.com/p/DURA-3-4-in-x-1-2-in-Schedule-40-PVC-Reducer-Bushing-C438-101/202101746
PVC Tee - 3/4" x 3/4" x 1/2" Slip/Slip/FPT | 3 | $0.97 | http://www.homedepot.com/p/DURA-3-4-in-x-3-4-in-x-1-2-in-Schedule-40-PVC-Reducing-Tee-C402-101/100344993
Probe Fitting | 3 | $2.66 | https://www.amazon.com/gp/product/B00TOOP8AU/

# Feed/Dose Module
![Doser module](https://user-images.githubusercontent.com/521978/31350657-d8236afe-acdc-11e7-8cbd-e6826b2f679a.jpg)

Item             | Quantity | Cost | Link
-----------------|----------|------|------------------------------
500mL Media Bottle | 1 | $15.01 | https://www.amazon.com/PYREX-500mL-Round-Storage-Bottles/dp/B004XR5TUM
Peristaltic Pump | 1 | $6.01 | https://www.aliexpress.com/item/12V-DIY-Dosing-Pump-Peristaltic-Dosing-Head-For-Aquarium-Lab-A-Laborator-High-Standard-Lab-Analytical/32820693824.html
Silicone Tubing - 6mm x 4mm | 4' | $? | ?
Sanitary Air Filter | 1 | $2.75 | https://www.amazon.com/Sanitary-Filter-Ferroday-Fittings-Homebrew/dp/B07149NMRM/
Silicone Tubing - 5/16" ID | 3" | ? | ? 
Acrylic for plastic "cupholder" | 8"x10" | $6 | ?

