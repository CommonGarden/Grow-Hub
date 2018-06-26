module.exports = {
  camera: true,
  actuators: [
    {
      type: 'relay',
      state: 'off',
      number: 1,
      title: 'NFT Pump',
      role: 'fan'
    },
    {
      type: 'relay',
      state: 'off',
      number: 2,
      title: 'Biochar Pump',
      role: 'humidifier'
    },
    {
      type: 'relay',
      state: 'off',
      number: 3,
      title: 'Doser Pump',
      role: 'heater'
    },
  ],
  sensors: [
    {
      type: 'temperature',
      title: 'Air Temperature',
      icon: 'wi wi-thermometer',
      unit: 'wi wi-celsius',
    },
    {
      type: 'humidity',
      title: 'Humidity',
      icon: 'wi wi-humidity',
    },
    {
      type: 'pressure',
      title: 'Atmospheric pressure',
      icon: 'wi wi-barometer',
    },
    {
      type: 'lux',
      title: 'Lux',
      icon: 'wi wi-day-sunny',
    },
    {
      type: 'ph',
      title: 'pH',
      icon: 'wi wi-raindrop',
    },
    {
      type: 'ec',
      title: 'Conductivity (ppm)',
      icon: 'wi wi-barometer',
    },
    {
      type: 'water_temperature',
      title: 'Water temperature',
      icon: 'wi wi-thermometer',
      unit: 'wi wi-celsius',
    },
    {
      type: 'bed_temp',
      title: 'Bed temperature',
      icon: 'wi wi-thermometer',
      unit: 'wi wi-celsius',
    },
    {
      type: 'bed_humidity',
      title: 'Bed humidity',
      icon: 'wi wi-humidity',
    },
    {
      type: 'flow_rate_1',
      title: 'Flow rate 1',
      icon: 'wi wi-barometer',
    },
    {
      type: 'flow_rate_2',
      title: 'Flow rate 2',
      icon: 'wi wi-barometer',
    },
    {
      type: 'water_level',
      title: 'Water level',
      icon: 'wi wi-barometer',
    },
    {
      type: 'water_level_etape',
      title: 'Water level (etape)',
      icon: 'wi wi-barometer',
    }
  ]
}
