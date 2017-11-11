# Install on Raspberry Pi

Make sure you have git and Node.js >=6.0.0 installed on your pi.

```bash
sudo apt-get update
sudo apt-get install wiringpi
sudo npm install forever -g
git clone https://github.com/CommonGarden/Grow-Hub
cd Grow-Hub/driver
npm install
sudo node Grow-Hub.js
```

### Run on boot
```bash
sudo nano /etc/init.d/grow
```

Paste in the follow (note this assumes you installed Grow-Hub in the root of the home folder for a user named `pi`):

```bash
#!/bin/bash
#/etc/init.d/grow
export PATH=$PATH:/usr/local/bin
export NODE_PATH=$NODE_PATH:/usr/local/lib/node_modules

case "$1" in
start)
exec sudo forever --sourceDir=/home/pi/Grow-Hub/driver -p /home/pi/Grow-Hub/dri$
;;
stop)
exec sudo forever stop --sourceDir=/home/pi/Grow-Hub/driver Grow-Hub.js
;;
*)
echo "Usage: /etc/init.d/grow {start|stop}"
exit 1
;;
esac
exit 0
```

Make it executable with the following command:
```bash
chmod 755 /etc/init.d/grow 
```

Feel free to test it:
```bash
sh /etc/init.d/grow start/stop
```

If all goes well, make it bootable:
```bash
sudo update-rc.d grow defaults
```

To remove it from boot:
```bash
sudo update-rc.d -f myService remove
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
