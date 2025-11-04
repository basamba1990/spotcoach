// components/matching/synergy-indicator.tsx
'use client'

interface SynergyIndicatorProps {
  synergy: number
  size?: 'sm' | 'md' | 'lg'
}

export function SynergyIndicator({ synergy, size = 'md' }: SynergyIndicatorProps) {
  const getColor = (value: number) => {
    if (value >= 80) return 'bg-green-500'
    if (value >= 60) return 'bg-yellow-500'
    if (value >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'h-2 text-xs'
      case 'lg':
        return 'h-4 text-base'
      default:
        return 'h-3 text-sm'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-sm">Synergie</span>
        <span className="text-white font-medium">{synergy}%</span>
      </div>
      
      <div className={`w-full bg-gray-600 rounded-full ${getSizeClasses(size)}`}>
        <div 
          className={`${getColor(synergy)} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${synergy}%` }}
        ></div>
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>Faible</span>
        <span>Moyenne</span>
        <span>Forte</span>
        <span>Excellente</span>
      </div>
    </div>
  )
}
