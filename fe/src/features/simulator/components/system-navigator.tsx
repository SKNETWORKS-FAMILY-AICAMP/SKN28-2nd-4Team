import { ActivitySquare, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MainViewTab = 'status' | 'advisor'

type SystemNavigatorProps = {
  activeTab: MainViewTab
  onTabSelect: (tab: MainViewTab) => void
}

export function SystemNavigator({
  activeTab,
  onTabSelect,
}: SystemNavigatorProps) {
  return (
    <aside className="flex flex-col h-full border-r border-outline-variant/30 bg-surface-container-low w-[280px] flex-shrink-0">
      <div className="p-6 border-b border-outline-variant/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded text-white font-serif font-black text-2xl tracking-tighter">
            U
          </div>
          <div className="flex flex-col">
            <h2 className="font-sans font-black tracking-widest text-[13px] text-primary uppercase">Umbrella Corp</h2>
            <p className="font-mono text-[10px] text-red-500 uppercase tracking-widest">Unauthorized Access</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6 flex-grow flex flex-col gap-2 px-4">
        <div className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-[0.2em] mb-2 px-2">
          Operations
        </div>
        
        <button
          onClick={() => onTabSelect('status')}
          className={cn(
            'flex items-center gap-4 px-4 py-4 rounded-md transition-all font-mono text-xs uppercase tracking-widest leading-none border border-transparent outline-none ring-0',
            activeTab === 'status'
              ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[inset_4px_0_0_0_#ef4444]'
              : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
          )}
        >
          <ActivitySquare className="size-4" />
          <span>Current Status</span>
        </button>

        <button
          onClick={() => onTabSelect('advisor')}
          className={cn(
            'flex items-center gap-4 px-4 py-4 rounded-md transition-all font-mono text-xs uppercase tracking-widest leading-none border border-transparent outline-none ring-0 relative overflow-hidden',
            activeTab === 'advisor'
              ? 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[inset_4px_0_0_0_#ef4444]'
              : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
          )}
        >
          <Cpu className="size-4" />
          <span>AI Assistant</span>
          {activeTab !== 'advisor' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </button>
      </nav>
      
      <div className="p-6 mt-auto border-t border-outline-variant/30">
        <div className="flex flex-col gap-1 text-[10px] font-mono text-on-surface-variant/50 uppercase">
          <span>Sys: Online</span>
          <span>Net: Secure</span>
        </div>
      </div>
    </aside>
  )
}
