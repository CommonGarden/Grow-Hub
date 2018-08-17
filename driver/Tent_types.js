module.exports = {
    camera: true,
    actuators: [
        {
            type: 'relay',
            state: 'off',
            number: 1,
            title: 'Lights',
            role: 'light'
        },
        {
            type: 'relay',
            state: 'off',
            number: 2,
            title: 'Water circulation',
            role: 'water_pump'
        },
        {
            type: 'relay',
            state: 'off',
            number: 3,
            title: 'Dosing pump',
            role: 'dosing_pump'
        },
        {
            type: 'relay',
            state: 'off',
            number: 4,
            title: 'Humidifier',
            role: 'humidifier'
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
            type: 'outside_temperature',
            title: 'External Air Temperature',
            icon: 'wi wi-thermometer',
            unit: 'wi wi-celsius',
        },
        {
            type: 'outside_humidity',
            title: 'External Humidity',
            icon: 'wi wi-humidity',
        },
        {
            type: 'outside_pressure',
            title: 'External Atmospheric Pressure',
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
            type: 'do',
            title: 'Dissolved Oxygen',
            icon: 'wi wi-raindrop',
        },
        {
            type: 'orp',
            title: 'ORP',
            icon: 'wi wi-raindrop',
        },
        {
            type: 'water_temperature',
            title: 'Water Temperature',
            icon: 'wi wi-thermometer',
            unit: 'wi wi-celsius',
        },
        {
            type: 'env_temp',
            title: 'Analog Water Temperature',
            icon: 'wi wi-thermometer',
            unit: 'wi wi-celsius',
        },
        {
            type: 'water_temp_on_ph',
            title: 'Water temperature (pH probe)',
            icon: 'wi wi-thermometer',
            unit: 'wi wi-celsius',
        },
        {
            type: 'water_level',
            title: 'Water level',
            icon: 'wi wi-barometer',
        },
    ]
}
