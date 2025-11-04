// components/charts/energy-radar.tsx
'use client'

import { Radar } from 'react-chartjs-2'

interface EnergyRadarProps {
  energyProfile: {
    fire: number
    earth: number
    air: number
    water: number
    spirit?: number
  }
}

export function EnergyRadar({ energyProfile }: EnergyRadarProps) {
  const data = {
    labels: ['Feu', 'Terre', 'Air', 'Eau', 'Esprit'],
    datasets: [
      {
        label: 'Profil Énergétique',
        data: [
          energyProfile.fire,
          energyProfile.earth,
          energyProfile.air,
          energyProfile.water,
          energyProfile.spirit || 50,
        ],
        backgroundColor: 'rgba(6, 182, 212, 0.2)',
        borderColor: 'rgba(6, 182, 212, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(6, 182, 212, 1)',
      },
    ],
  }

  const options = {
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 12,
          },
        },
      },
    },
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Profil Énergétique</h3>
      <div className="h-64">
        <Radar data={data} options={options} />
      </div>
    </div>
  )
}
