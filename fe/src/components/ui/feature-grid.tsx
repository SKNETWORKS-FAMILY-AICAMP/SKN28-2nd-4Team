import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface FeatureGridItem {
  icon: LucideIcon
  eyebrow?: string
  title: string
  description: string
}

export interface FeatureGridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof featureCardVariants> {
  items: FeatureGridItem[]
  columns?: 1 | 2 | 3
}

const featureCardVariants = cva(
  'group flex h-full flex-col gap-3 rounded-xl border bg-card/80 p-5 text-card-foreground transition-colors',
  {
    variants: {
      tone: {
        default: 'border-outline/20 hover:border-primary/20',
        info: 'border-secondary/25 bg-secondary/5',
        success: 'border-emerald-500/25 bg-emerald-500/5',
        warning: 'border-amber-500/25 bg-amber-500/5',
        danger: 'border-red-500/25 bg-red-500/5',
      },
    },
    defaultVariants: {
      tone: 'default',
    },
  },
)

const columnClassMap: Record<NonNullable<FeatureGridProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
}

export const FeatureGrid = React.forwardRef<HTMLDivElement, FeatureGridProps>(
  ({ items, className, columns = 3, tone }, ref) => {
    if (!items.length) return null

    return (
      <div
        ref={ref}
        className={cn('grid gap-4', columnClassMap[columns], className)}
      >
        {items.map((item) => {
          const Icon = item.icon

          return (
            <article key={`${item.eyebrow ?? item.title}-${item.title}`} className={featureCardVariants({ tone })}>
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-white/10 bg-background/70 p-2 text-secondary shadow-[0_0_18px_rgba(14,165,233,0.12)]">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  {item.eyebrow ? (
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-secondary/80">
                      {item.eyebrow}
                    </p>
                  ) : null}
                  <h3 className="mt-1 text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                {item.description}
              </p>
            </article>
          )
        })}
      </div>
    )
  },
)

FeatureGrid.displayName = 'FeatureGrid'
