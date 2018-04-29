module.exports = {
  actuators: [
    {
      type: 'relay',
      state: 'off',
      number: 1,
      title: '1',
      role: 'fan'
    },
    {
      type: 'relay',
      state: 'off',
      number: 2,
      title: '2',
      role: 'humidifier'
    },
    {
      type: 'relay',
      state: 'off',
      number: 3,
      title: '3',
      role: 'heater'
    },
  ],
  sensors: [
      {
        type: 'temperature',
        title: 'Air Temperature',
        icon: 'wi wi-thermometer',
        unit: 'wi wi-celsius',
        max: 40
      },
      {
        type: 'humidity',
        title: 'Humidity',
        icon: 'wi wi-humidity',
        max: 100
      },
      {
        type: 'pressure',
        title: 'Atmospheric pressure',
        icon: 'wi wi-barometer',
        max: 2000
      },
      {
        type: 'lux',
        title: 'Lux',
        icon: 'wi wi-day-sunny',
        max: 10000
      },
      {
        type: 'ph',
        title: 'pH',
        icon: 'wi wi-raindrop',
        max: 14,
      },
      {
        type: 'ec',
        title: 'Conductivity (ppm)',
        icon: 'wi wi-barometer',
        max: 2000,
      },
      {
        type: 'water_temperature',
        title: 'Water temperature',
        icon: 'wi wi-thermometer',
        unit: 'wi wi-celsius',
        max: 40,
      },
    ]
}
