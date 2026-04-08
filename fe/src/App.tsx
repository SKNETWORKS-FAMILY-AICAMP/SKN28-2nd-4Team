import { ArrowRight, BookOpenText, FlaskConical, Layers3, Server } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function App() {
  const workspaces = [
    {
      name: 'Frontend',
      description: 'Vite, React, Tailwind v4, and shadcn/ui base app.',
      icon: Layers3,
    },
    {
      name: 'Backend',
      description: 'Python 3.12 backend workspace managed with uv.',
      icon: Server,
    },
    {
      name: 'Research',
      description: 'Separate Python workspace for notebooks, experiments, and pipelines.',
      icon: FlaskConical,
    },
  ]

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col gap-6 px-6 py-10 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-medium text-muted-foreground">SKN28 2nd 4team</p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Monorepo base for the retention strategy simulator
              </h1>
              <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                The workspace is ready for frontend, backend, research, and docs to evolve
                independently without losing a single project root.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg">Start building</Button>
              <Button size="lg" variant="outline">
                Open docs
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {workspaces.map(({ name, description, icon: Icon }) => (
            <Card key={name} className="border bg-card/95">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
                    <Icon className="size-5" />
                  </span>
                  {name}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <span className="text-sm text-muted-foreground">Base workspace created</span>
              </CardFooter>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Repository conventions</CardTitle>
              <CardDescription>
                A few shared defaults are already wired in for the team.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <div className="rounded-2xl border bg-muted/40 p-4">
                <p className="font-medium text-foreground">Python with uv</p>
                <p className="mt-2">Both `be` and `back_research` are isolated Python 3.12 workspaces.</p>
              </div>
              <div className="rounded-2xl border bg-muted/40 p-4">
                <p className="font-medium text-foreground">Zed with ty</p>
                <p className="mt-2">The root `.zed/settings.json` enables `ty` and `ruff` for Python files.</p>
              </div>
              <div className="rounded-2xl border bg-muted/40 p-4">
                <p className="font-medium text-foreground">Frontend foundation</p>
                <p className="mt-2">The Vite app is configured for Tailwind v4 and shadcn/ui components.</p>
              </div>
              <div className="rounded-2xl border bg-muted/40 p-4">
                <p className="font-medium text-foreground">Docs separation</p>
                <p className="mt-2">Existing planning documents now live under `docs/` at the repo root.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpenText className="size-5" />
                Suggested next steps
              </CardTitle>
              <CardDescription>Start from one layer, then connect the repo pieces.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1. Define the backend API surface in `be/`.</p>
              <p>2. Model simulation logic and experiments in `back_research/`.</p>
              <p>3. Turn the frontend shell into the playable simulator UI in `fe/`.</p>
              <p>4. Keep architecture and delivery notes aligned in `docs/`.</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}

export default App
