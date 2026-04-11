import { LayoutDashboard } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { SimulatorDashboardData, SystemId } from '@/features/simulator/contracts'
import { cn } from '@/lib/utils'

type SystemNavigatorProps = {
  systems: SimulatorDashboardData['systems']
  selectedSystemId: SystemId
  onSelect: (systemId: SystemId) => void
}

export function SystemNavigator({
  systems,
  selectedSystemId,
  onSelect,
}: SystemNavigatorProps) {
  return (
    <aside className="flex flex-col h-full border-r border-outline-variant/15 bg-surface-container-low w-64 flex-shrink-0 transition-all duration-300 ease-in-out">
      <div className="p-6 flex flex-col items-center gap-2">
        <Avatar className="w-16 h-16 rounded-xl border-2 border-primary/20 bg-surface-container-highest">
          <AvatarFallback className="text-secondary font-bold font-serif text-2xl">
            CEO
          </AvatarFallback>
        </Avatar>
        <h2 className="font-serif text-xl font-bold text-primary">Strategy Office</h2>
        <p className="font-sans text-sm tracking-tight text-on-surface-variant opacity-70">
          Executive Dashboard
        </p>
      </div>
      
      <nav className="mt-4 flex-grow overflow-y-auto px-2">
        <div className="text-xs font-semibold text-on-surface-variant/60 uppercase tracking-wider mb-2 px-4">
          운영 축 (Systems)
        </div>
        <ul className="flex flex-col gap-1">
          {systems.map((system) => {
            const isSelected = selectedSystemId === system.id
            return (
              <li
                key={system.id}
                onClick={() => onSelect(system.id)}
                className={cn(
                  'flex items-center gap-3 font-sans font-medium px-4 py-3 cursor-pointer rounded-lg transition-colors',
                  isSelected
                    ? 'border-l-4 border-primary bg-primary/5 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-highest/50'
                )}
              >
                <LayoutDashboard className="size-4" />
                <div className="flex-1 overflow-hidden">
                  <div className="truncate text-sm">{system.name}</div>
                </div>
                {system.danger > 50 && (
                  <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </li>
            )
          })}
        </ul>
      </nav>
      
      <div className="p-6 mt-auto">
        <button className="w-full ink-gradient text-primary-foreground py-3 rounded-lg font-label uppercase text-xs tracking-widest shadow-lg active:scale-[0.98] transition-transform">
          Consult Strategy
        </button>
      </div>
    </aside>
  )
}
