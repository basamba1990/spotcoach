// components/charts/compatibility-chart.tsx
'use client'

import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface CompatibilityChartProps {
  matchData: {
    communication: number
    values: number
    interests: number
    energy: number
    goals: number
  }
  partnerData?: {
    communication: number
    values: number
    interests: number
    energy: number
    goals: number
  }
}

export function CompatibilityChart({ matchData, partnerData }: CompatibilityChartProps) {
  const data = {
    labels: ['Communication', 'Valeurs', 'Intérêts', 'Énergie', 'Objectifs'],
    datasets: [
      {
        label: 'Votre Profil',
        data: [
          matchData.communication,
          matchData.values,
          matchData.interests,
          matchData.energy,
          matchData.goals,
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
      },
      ...(partnerData ? [{
        label: 'Profil Partenaire',
        data: [
          partnerData.communication,
          partnerData.values,
          partnerData.interests,
          partnerData.energy,
          partnerData.goals,
        ],
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
      }] : [])
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
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
    },
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Radar de Compatibilité</h3>
      <div className="h-64">
        <Radar data={data} options={options} />
      </div>
    </div>
  )
}
