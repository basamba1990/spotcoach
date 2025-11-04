// components/charts/progress-chart.tsx
'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ProgressChartProps {
  progressData: {
    dates: string[]
    compatibilityScores: number[]
    projectCompletions: number[]
  }
}

export function ProgressChart({ progressData }: ProgressChartProps) {
  const data = {
    labels: progressData.dates,
    datasets: [
      {
        label: 'Score de Compatibilité',
        data: progressData.compatibilityScores,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Projets Complétés',
        data: progressData.projectCompletions,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
        },
      },
      title: {
        display: true,
        text: 'Progression des Connections',
        color: 'rgba(255, 255, 255, 0.9)',
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
    },
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
