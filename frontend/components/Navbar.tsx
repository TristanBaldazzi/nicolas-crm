'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-primary-500 bg-clip-text text-transparent">
              RCMPLAY
            </span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors relative group"
            >
              Accueil
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link 
              href="/catalogue" 
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors relative group"
            >
              Catalogue
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full"></span>
            </Link>
            <Link 
              href="/notre-societe" 
              className="text-gray-700 hover:text-primary-600 font-medium transition-colors relative group"
            >
              Notre société
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full"></span>
            </Link>
            {user ? (
              <>
                {isAdmin() && (
                  <Link 
                    href="/admin" 
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors relative group"
                  >
                    Admin
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full"></span>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-all shadow-md hover:shadow-lg"
              >
                Connexion
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-slide-up">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-700 hover:text-primary-600 font-medium">Accueil</Link>
              <Link href="/catalogue" className="text-gray-700 hover:text-primary-600 font-medium">Catalogue</Link>
              <Link href="/notre-societe" className="text-gray-700 hover:text-primary-600 font-medium">Notre société</Link>
              {user ? (
                <>
                  {isAdmin() && <Link href="/admin" className="text-gray-700 hover:text-primary-600 font-medium">Admin</Link>}
                  <button onClick={logout} className="text-gray-700 hover:text-primary-600 font-medium text-left">Déconnexion</button>
                </>
              ) : (
                <Link href="/login" className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold text-center">Connexion</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
