'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi, categoriesApi } from '@/lib/api';
import { getImageUrl } from '@/lib/config';
import { useAuthStore } from '@/lib/store';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loadFromStorage, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll({ featured: 'true', limit: 6 }),
        categoriesApi.getAll({ parentOnly: 'true' }),
      ]);
      setFeaturedProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Design Professionnel */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-green-950 to-gray-900">
        {/* Background subtil */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.08),transparent_70%)]"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Floating Orbs subtils */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-500/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>

        {/* Icônes décoratives */}
        {/* Ordinateur - Haut gauche */}
        <div className="absolute top-16 left-8 md:top-24 md:left-16 w-12 h-12 md:w-16 md:h-16 text-white/20 hover:text-white/40 transition-colors z-10">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Clé/Outils - Haut droite */}
        <div className="absolute top-20 right-8 md:top-28 md:right-20 w-10 h-10 md:w-14 md:h-14 text-white/20 hover:text-white/40 transition-colors z-10">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Boîte à outils/Pièces - Bas gauche */}
        <div className="absolute bottom-24 left-12 md:bottom-32 md:left-24 w-14 h-14 md:w-18 md:h-18 text-white/20 hover:text-white/40 transition-colors z-10">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>

        {/* Téléphone - Bas droite */}
        <div className="absolute bottom-20 right-12 md:bottom-28 md:right-24 w-12 h-12 md:w-16 md:h-16 text-white/20 hover:text-white/40 transition-colors z-10">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>

        {/* Ordinateur portable - Milieu gauche */}
        <div className="absolute top-1/2 left-4 md:left-12 -translate-y-1/2 w-10 h-10 md:w-14 md:h-14 text-white/15 hover:text-white/35 transition-colors z-10">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Écran - Milieu droite */}
        <div className="absolute top-1/2 right-4 md:right-12 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 text-white/15 hover:text-white/35 transition-colors z-10">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 17v-4" />
          </svg>
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Main Hero Content */}
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge discret */}
            <div className="inline-block mb-6">
              <span className="px-4 py-1.5 bg-green-500/10 backdrop-blur-sm border border-green-400/20 rounded-full text-green-300 text-xs font-medium tracking-wide">
                Votre partenaire de confiance au Luxembourg
              </span>
            </div>
            
            {/* Titre professionnel */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
              <span className="block text-white mb-1">RCMPLAY</span>
              <span className="block bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">
                REPARATION
              </span>
            </h1>
            
            {/* Description sobre */}
            <p className="text-base md:text-lg lg:text-xl mb-8 text-gray-300 font-light max-w-3xl mx-auto leading-relaxed">
              Excellence en produits professionnels et pièces détachées
            </p>
            
            {/* CTA Buttons discrets */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/catalogue"
                className="group relative px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-sm overflow-hidden shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Découvrir le catalogue
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </Link>
              <Link
                href="/notre-societe"
                className="px-8 py-3 bg-white/5 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/10 hover:border-white/30 transition-all duration-200"
              >
                Notre société
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator amélioré */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <span className="text-white/60 text-xs font-medium tracking-wider">SCROLL</span>
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Marques Partenaires - Section Moderne */}
      <section className="py-32 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Nos <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">marques</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Partenariats exclusifs avec les leaders du marché
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Numatic', logo: '/logos/numatic.png' },
              { name: 'Primus', logo: '/logos/primus.png' },
              { name: 'Bosch', logo: '/logos/bosch.png' },
              { name: 'Electrolux', logo: '/logos/electrolux.png' }
            ].map((brand) => (
              <Link
                key={brand.name}
                href={`/catalogue?brand=${brand.name}`}
                className="group relative p-10 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-28 h-28 mx-auto mb-6 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative">
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={112}
                      height={112}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-center text-green-600 font-semibold group-hover:gap-2 transition-all">
                    <span>Découvrir</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages Section - Design Professionnel */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Pourquoi choisir <span className="text-emerald-600">RCMPLAY</span> ?
              </h2>
              <p className="text-base text-gray-600 max-w-2xl mx-auto">
                Des avantages qui font la différence
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Prix transparents',
                  desc: 'Consultez notre catalogue en ligne avec toutes les informations et prix transparents, sans surprise.',
                  bgColor: 'bg-emerald-50',
                  textColor: 'text-emerald-600',
                  hoverBg: 'group-hover:bg-emerald-100'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'Service rapide',
                  desc: 'Nos équipes spécialisées vous proposent des solutions adaptées rapidement pour répondre à vos besoins.',
                  bgColor: 'bg-blue-50',
                  textColor: 'text-blue-600',
                  hoverBg: 'group-hover:bg-blue-100'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  ),
                  title: 'Suivi personnalisé',
                  desc: 'Nous vous tenons informés de la disponibilité de vos produits et vous prévenons dès que votre commande est prête.',
                  bgColor: 'bg-green-50',
                  textColor: 'text-green-600',
                  hoverBg: 'group-hover:bg-green-100'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'Qualité garantie',
                  desc: 'Tous nos produits sont garantis. Nous travaillons uniquement avec des marques reconnues pour leur qualité.',
                  bgColor: 'bg-purple-50',
                  textColor: 'text-purple-600',
                  hoverBg: 'group-hover:bg-purple-100'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:border-emerald-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 ${item.bgColor} ${item.hoverBg} rounded-lg flex items-center justify-center ${item.textColor} transition-colors duration-200`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pièces détachées - Section Moderne */}
      <section className="py-32 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Spécialiste reconnu
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 leading-tight">
                  Pièces détachées <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">professionnelles</span>
                </h2>
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  En contact direct avec les grossistes du secteur, RCMPLAY est votre partenaire de confiance pour toutes vos commandes de pièces détachées et accessoires professionnels au Luxembourg.
                </p>
                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Large gamme disponible</h3>
                      <p className="text-gray-600">Tous types de pièces détachées sur commande</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Réseau de fournisseurs</h3>
                      <p className="text-gray-600">Accès privilégié aux meilleurs grossistes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Service personnalisé</h3>
                      <p className="text-gray-600">Accompagnement dédié pour vos besoins spécifiques</p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/catalogue"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  Explorer le catalogue
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
              <div className="relative">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-br from-green-200 to-green-100 rounded-3xl blur-2xl opacity-50"></div>
                  <div className="relative bg-gradient-to-br from-green-50 to-white p-12 rounded-3xl border-2 border-green-100">
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { name: 'Numatic', logo: '/logos/numatic.png' },
                        { name: 'Primus', logo: '/logos/primus.png' },
                        { name: 'Bosch', logo: '/logos/bosch.png' },
                        { name: 'Electrolux', logo: '/logos/electrolux.png' }
                      ].map((brand) => (
                        <div key={brand.name} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
                          <div className="h-16 mx-auto mb-4 flex items-center justify-center relative">
                            <Image
                              src={brand.logo}
                              alt={brand.name}
                              width={64}
                              height={64}
                              className="object-contain"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Produits en vedette - Design Moderne */}
      {loading ? (
        <div className="text-center py-32 bg-gray-50">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
          <p className="mt-6 text-gray-600 text-lg">Chargement des produits...</p>
        </div>
      ) : featuredProducts.length > 0 && (
        <section className="py-32 bg-gradient-to-b from-white via-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                Produits en <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">vedette</span>
              </h2>
              <p className="text-xl text-gray-600">Découvrez notre sélection de produits premium</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product: any, idx: number) => (
                <Link
                  key={product._id}
                  href={`/produit/${product.slug}`}
                  className="group relative bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500"></div>
                  <div className="relative bg-white rounded-3xl">
                    {product.images?.[0] && (
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        <img
                          src={getImageUrl(product.images[0].url)}
                          alt={product.images[0].alt || product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        {product.brand && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-white/90 backdrop-blur-sm text-green-700 px-4 py-2 rounded-full text-xs font-bold">
                              {product.brand}
                            </span>
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                          {product.isBestSeller && (
                            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-xs font-black shadow-xl uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927a1 1 0 011.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Best Seller
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                              ⭐ Vedette
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 mb-6 line-clamp-2 leading-relaxed">
                        {product.shortDescription}
                      </p>
                      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                        <span className="text-3xl font-black bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                          {product.price.toFixed(2)} €
                        </span>
                        <span className="flex items-center gap-2 text-green-600 font-semibold group-hover:gap-3 transition-all">
                          Voir
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-20">
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Voir tout le catalogue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Conditionnelle selon connexion */}
      {!authLoading && (
        user ? (
          /* Section pour utilisateur connecté - Compacte et professionnelle */
          <section className="py-16 bg-gradient-to-br from-gray-50 to-white border-t border-gray-200">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-10">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        Bienvenue, {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-gray-600">
                        Accédez à votre espace client pour gérer vos commandes et favoris
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Link
                        href="/dashboard"
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg"
                      >
                        Mon espace
                      </Link>
                      <Link
                        href="/catalogue"
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all"
                      >
                        Catalogue
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Section pour utilisateur non connecté - Avantages compte */
          <section className="py-32 bg-gradient-to-br from-gray-900 via-green-950 to-gray-900 text-white relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_70%)]"></div>
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
                backgroundSize: '60px 60px'
              }}></div>
            </div>
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
                    Rejoignez <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">RCMPLAY</span>
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                    Créez votre compte et profitez d'avantages exclusifs
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                  {[
                    {
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      ),
                      title: 'Prix préférentiels',
                      desc: 'Accédez à des tarifs exclusifs réservés aux membres'
                    },
                    {
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      ),
                      title: 'Commandes simplifiées',
                      desc: 'Gérez vos commandes et suivez vos livraisons en temps réel'
                    },
                    {
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      ),
                      title: 'Liste de favoris',
                      desc: 'Sauvegardez vos produits préférés pour un accès rapide'
                    },
                    {
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ),
                      title: 'Historique des commandes',
                      desc: 'Consultez et réimprimez vos factures à tout moment'
                    },
                    {
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ),
                      title: 'Support prioritaire',
                      desc: 'Bénéficiez d\'un accompagnement dédié et personnalisé'
                    },
                    {
                      icon: (
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ),
                      title: 'Notifications exclusives',
                      desc: 'Soyez informé en premier des nouveautés et promotions'
                    }
                  ].map((benefit, idx) => (
                    <div
                      key={idx}
                      className="group p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                        {benefit.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{benefit.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-105"
                  >
                    Créer mon compte
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <p className="mt-6 text-gray-400 text-sm">
                    Déjà un compte ? <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold underline">Connectez-vous</Link>
                  </p>
                </div>
              </div>
            </div>
          </section>
        )
      )}

      {/* Contact Section - En bas */}
      <section className="py-24 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
                Contactez-nous
              </h2>
              <p className="text-xl text-gray-600">
                Nous sommes à votre disposition pour répondre à toutes vos questions
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <a
                href="tel:+352691775623"
                className="group p-8 bg-gradient-to-br from-green-50 to-white rounded-3xl border-2 border-green-100 hover:border-green-300 transition-all duration-300 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Téléphone</h3>
                <p className="text-green-600 font-semibold text-lg">(+352) 691 775 623</p>
              </a>

              <a
                href="mailto:contact@rcmplay-reparation.lu"
                className="group p-8 bg-gradient-to-br from-emerald-50 to-white rounded-3xl border-2 border-emerald-100 hover:border-emerald-300 transition-all duration-300 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
                <p className="text-emerald-600 font-semibold text-sm" style={{ wordBreak: 'keep-all', overflowWrap: 'normal' }}>contact@rcmplay-reparation.lu</p>
              </a>

              <div className="p-8 bg-gradient-to-br from-green-50 to-white rounded-3xl border-2 border-green-100 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Horaires</h3>
                <p className="text-green-600 font-semibold text-lg">Sur rendez-vous</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
