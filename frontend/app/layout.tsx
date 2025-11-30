import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ClientLayout from '@/components/ClientLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RCMPLAY-REPARATION - Vente de produits au Luxembourg',
  description: 'Catalogue de produits professionnels - Nematic, Prinus, Bosch, Electro Lux',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}

