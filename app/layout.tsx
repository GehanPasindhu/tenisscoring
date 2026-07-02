import { Provider } from "@/components/ui/provider"
import AppShell from "@/components/AppShell"
import { Outfit } from 'next/font/google'

const outfit = Outfit({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800', '900'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.className}>
      <body className={outfit.className} suppressHydrationWarning>
        <Provider>
          <AppShell>{children}</AppShell>
        </Provider>
      </body>
    </html>
  )
}
