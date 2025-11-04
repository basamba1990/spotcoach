// app/(dashboard)/layout.tsx
import { Providers } from '@/app/providers'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <DashboardNav />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </Providers>
  )
}
