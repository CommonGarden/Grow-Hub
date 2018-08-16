module.exports = {
  camera: true,
  actuators: [
    {
      type: 'relay',
      state: 'off',
      number: 1,
      title: 'Fan',
      role: 'fan'
    },
    {
      type: 'relay',
      state: 'off',
      number: 2,
      title: 'Humidifier',
      role: 'humidifier'
    },
    {
      type: 'relay',
      state: 'off',
      number: 3,
      title: 'Heater',
      role: 'heater'
    },
    {
      type: 'relay',
      state: 'off',
      number: 4,
      title: 'Light',
      role: 'light'
    }
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
        type: 'orp',
        title: 'ORP',
        icon: 'wi wi-raindrop',
      },
      {
        type: 'lux',
        title: 'Lux',
        icon: 'wi wi-day-sunny',
      },
      {
        type: 'dissolved_oxygen',
        title: 'Dissolved Oxygen',
        icon: 'wi wi-raindrop',
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
    ]
}
