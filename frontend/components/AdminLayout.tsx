'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAdmin, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
    if (!user) {
      router.push('/login');
    } else if (!isAdmin()) {
      router.push('/');
    }
  }, [user, isAdmin, router, loadFromStorage]);

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin" className="text-xl font-bold text-primary-600">
              RCMPLAY Admin
            </Link>
            <div className="flex gap-4">
              <Link href="/" className="text-gray-600 hover:text-primary-600">
                Site public
              </Link>
              <Link href="/admin" className="text-gray-600 hover:text-primary-600">
                Dashboard
              </Link>
              <Link href="/admin/produits" className="text-gray-600 hover:text-primary-600">
                Produits
              </Link>
              <Link href="/admin/categories" className="text-gray-600 hover:text-primary-600">
                Catégories
              </Link>
              <Link href="/admin/clients" className="text-gray-600 hover:text-primary-600">
                Clients
              </Link>
              <Link href="/admin/email" className="text-gray-600 hover:text-primary-600">
                Email Marketing
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

