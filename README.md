# Install on Raspberry Pi

Install the latest version of Node. Todo this, either search for an article to help walk you through it or run the following:

```
wget https://nodejs.org/dist/v8.9.1/node-v8.9.1-linux-armv7l.tar.xz
tar -xvf node-v8.9.1-linux-armv7l.tar.xz
cd node-v8.9.1-linux-armv7l
```

Then copy to `/usr/local`:

```
sudo cp -R * /usr/local/
```

Test that's it's working with `node -v`.

Once node.js is working, you're ready for the rest:

```bash
sudo apt-get update
sudo apt-get install wiringpi usbrelay git i2c-tools
git clone https://github.com/CommonGarden/Grow-Hub
cd Grow-Hub/driver
npm install
sudo node Grow-Hub.js
```

## Connecting to your Grow-IoT instance
By default, the example driver connects to https://grow.commongarden.org.

To change this see the bottom of the `example-device.js` file. It currently reads.

```
  growHub.connect({
    host: 'grow.commongarden.org',
    port: 443,
    ssl: true
  });
```

For development it's easier to simply connect to you local computer. Find your computer's IP address and change the `host`, `port`, and `ssl` options:
```
  growHub.connect({
    host: '10.0.0.198', // The ip address of the host
    port: 3000, // The port you are running Grow-IoT on
    ssl: false
  });
```

### Run on boot
Once you're happy with your driver you'll want to start it on boot in case your device looses power.

Install [forever](https://www.npmjs.com/package/forever) globally.

```
sudo npm install forever -g
```

Then create a new text file in`/etc/init.d/`:
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
sudo update-rc.d -f grow remove
```

One last step, edit the [/etc/rc.local file](https://www.raspberrypi.org/documentation/linux/usage/rc-local.md).

```
sudo nano /etc/rc.local
```

Insert the following line before `exit 0`:
```
sh /etc/init.d/grow start
```

Reboot and your pi should start into the Grow-Hub driver.

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


### Optional Bluetooth setup
These instructions come from this [Headless Raspberry Pi configuration over Bluetooth](https://hacks.mozilla.org/2017/02/headless-raspberry-pi-configuration-over-bluetooth/) article. Thanks to Mozilla and Patrick Hundal for providing an excellent resource.

Let’s start by creating the main script that will set up and establish the default Bluetooth services and serial port you will connect to on startup.

You’ll create this file in the root directory, like so:

```
sudo nano /btserial.sh
```

Add the following lines to the script:

```
#!/bin/bash -e

#Edit the display name of the RaspberryPi so you can distinguish
#your unit from others in the Bluetooth console
#(very useful in a class setting)

echo PRETTY_HOSTNAME=raspberrypi > /etc/machine-info

# Edit /lib/systemd/system/bluetooth.service to enable BT services
sudo sed -i: 's|^Exec.*toothd$| \
ExecStart=/usr/lib/bluetooth/bluetoothd -C \
ExecStartPost=/usr/bin/sdptool add SP \
ExecStartPost=/bin/hciconfig hci0 piscan \
|g' /lib/systemd/system/bluetooth.service

# create /etc/systemd/system/rfcomm.service to enable 
# the Bluetooth serial port from systemctl
sudo cat <<EOF | sudo tee /etc/systemd/system/rfcomm.service > /dev/null
[Unit]
Description=RFCOMM service
After=bluetooth.service
Requires=bluetooth.service

[Service]
ExecStart=/usr/bin/rfcomm watch hci0 1 getty rfcomm0 115200 vt100 -a pi

[Install]
WantedBy=multi-user.target
EOF

# enable the new rfcomm service
sudo systemctl enable rfcomm

# start the rfcomm service
sudo systemctl restart rfcomm
```

Save the file, and then make it executable by updating its permissions like so:

`chmod 755 /home/pi/btserial.sh`

Now you have the basics of the script required to turn on the Bluetooth service and configure it.  But to do this 100% headless, you’ll need to run this new script on startup. Let’s edit /etc/rc.local to launch this script automatically.

```
sudo nano /etc/rc.local
```

Add the following lines after the initial comments:

```
#Launch bluetooth service startup script /home/pi/btserial.sh
sudo /btserial.sh &
```

Save the `rc.local` script.

Now you are ready to go.  Plug in power to the Rpi and give it 30 seconds or so to startup. Then unplug it, and plug it in again and let it boot up a second time.  Restarting the Bluetooth service doesn’t work correctly, so we need to reboot.

Now let’s connect.

### Connecting to your RPi via Bluetooth

On your desktop/laptop, open up your Bluetooth preferences and ensure Bluetooth is enabled.

Select “raspberrypi” (or whatever you have used for PRETTY_HOSTNAME in the btserial.sh script) when it appears and pair with it. It should pair automatically (remember what we said earlier about security issues?)

Open a terminal window on your local machine, and start a screen session to connect via the new Bluetooth serial port created from the RPi connection. First let’s check the name of the serial connection:

```
ls /dev/cu.*
```

This should produce a list of available serial ports, one of which should now be named after your pi. Then we can connect.

```
screen /dev/cu.raspberrypi-SerialPort 115200
```

Give it a second,  and you should be at the prompt of the RPi console!  Congrats!


After you setup a solid wifi connection, it's good to secure the bluetooth configuration. To do so, Let’s edit `/etc/rc.local` to NOT launch the `btserial.sh` script automatically.

```
sudo nano /etc/rc.local
```

Comment out the following lines:

```
#Launch bluetooth service startup script /home/pi/btserial.sh
#sudo /btserial.sh &
```
