import NDIR
import time

sensor = NDIR.Sensor(0x4D)

if sensor.begin() == False:
    print("CO2 Adaptor initialization FAILED!")
    exit()

while True:
    if sensor.measure():
        print(str(sensor.ppm))
        # print("CO2 Concentration: " + str(sensor.ppm) + "ppm")
    else:
        print("CO2 Sensor communication ERROR.")

    time.sleep(1)
