'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function NotreSocietePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Compact & Professional */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-white via-emerald-50/30 to-green-50/30 border-b border-gray-100">
        {/* Subtle background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-64 h-64 bg-emerald-100/20 rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-green-100/20 rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>
        </div>
        
        {/* Floating icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Computer screen - Left */}
          <div className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 animate-float">
            <svg className="w-16 h-16 md:w-20 md:h-20 text-emerald-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          {/* Washing machine - Right */}
          <div className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 animate-float-delayed">
            <svg className="w-16 h-16 md:w-20 md:h-20 text-emerald-500 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" rx="1" strokeWidth="1.5" />
              <circle cx="12" cy="10" r="3" strokeWidth="1.5" />
              <path d="M8 18h8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(-50%) translateY(0px);
            }
            50% {
              transform: translateY(-50%) translateY(-20px);
            }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float 3s ease-in-out infinite;
            animation-delay: 1.5s;
          }
        `}</style>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full mb-6">
                <span className="text-emerald-700 text-xs font-semibold uppercase tracking-wide">À propos de nous</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
                <span className="text-gray-900">Notre </span>
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  société
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-medium mb-8">
                Votre partenaire de confiance au Luxembourg pour l'excellence en produits professionnels et pièces détachées
              </p>
            </div>
            
            {/* Compact stats */}
            <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl mx-auto">
              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-gray-900 leading-none">15+</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase">Ans</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-gray-900 leading-none">1000+</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase">Clients</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-purple-200 hover:shadow-md transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-lg font-black text-gray-900 leading-none">100%</div>
                  <div className="text-xs font-semibold text-gray-600 uppercase">Qualité</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </section>

      {/* Introduction Section */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold mb-5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Leader au Luxembourg
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
                  RCMPLAY-REPARATION
                </h2>
                <p className="text-base text-gray-600 mb-4 leading-relaxed">
                  Depuis notre création, <strong className="text-gray-900">RCMPLAY-REPARATION</strong> s'est imposée comme le partenaire de référence au Luxembourg pour la distribution de produits professionnels et de pièces détachées de qualité supérieure.
                </p>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Notre expertise et notre réseau de partenaires privilégiés nous permettent de vous offrir un accès exclusif aux meilleures marques du marché, avec un service personnalisé et une réactivité exceptionnelle.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Que vous soyez un professionnel recherchant des solutions techniques précises ou un particulier en quête de qualité, nous mettons notre savoir-faire à votre service pour répondre à tous vos besoins.
                </p>
              </div>
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-green-200 to-green-100 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border-2 border-green-100 shadow-xl">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: 'Numatic', logo: '/logos/numatic.png' },
                      { name: 'Primus', logo: '/logos/primus.png' },
                      { name: 'Bosch', logo: '/logos/bosch.png' },
                      { name: 'Electrolux', logo: '/logos/electrolux.png' }
                    ].map((brand) => (
                      <div key={brand.name} className="bg-white p-5 rounded-xl shadow-md border border-gray-100 text-center transform hover:scale-105 transition-transform">
                        <div className="h-20 mx-auto flex items-center justify-center relative">
                          <Image
                            src={brand.logo}
                            alt={brand.name}
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-green-200 text-center">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Nos partenaires exclusifs</p>
                    <p className="text-green-600 font-bold text-sm">Marques leaders du secteur</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
                Notre <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">engagement</span>
              </h2>
              <p className="text-base text-gray-600 max-w-2xl mx-auto">
                Des valeurs fortes qui guident chacune de nos actions
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Mission */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-lg border border-gray-100 h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">Notre mission</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Fournir à nos clients des produits professionnels de la plus haute qualité, en garantissant un service client irréprochable, des prix transparents et une réactivité exemplaire.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Nous nous engageons à être votre partenaire de confiance, en vous accompagnant à chaque étape de votre projet avec expertise et professionnalisme.
                  </p>
                </div>
              </div>

              {/* Vision */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-lg border border-gray-100 h-full">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 transform group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">Notre vision</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    Devenir la référence incontournable au Luxembourg pour tous les professionnels et particuliers recherchant l'excellence en matière de produits techniques et de pièces détachées.
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Nous aspirons à construire des relations durables basées sur la confiance, la qualité et l'innovation constante pour répondre aux défis de demain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs Section - Compact & Efficient */}
      <section className="py-16 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3 inline-block">NOS VALEURS</span>
              <h2 className="text-3xl md:text-4xl font-light mb-2">
                <span className="text-gray-900">Les principes qui nous </span>
                <span className="text-emerald-600">guident</span>
              </h2>
              <p className="text-sm text-gray-600 max-w-xl mx-auto">
                Des valeurs fortes qui façonnent notre excellence au quotidien
              </p>
            </div>

            {/* Compact Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Qualité garantie',
                  desc: 'Uniquement des produits de marques reconnues et certifiées, avec garantie complète',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  accent: 'emerald'
                },
                {
                  title: 'Service de proximité',
                  desc: 'Un accompagnement personnalisé et un suivi dédié pour chaque client',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  accent: 'blue'
                },
                {
                  title: 'Transparence totale',
                  desc: 'Prix clairs et détaillés, sans surprise ni frais cachés',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ),
                  accent: 'amber'
                },
                {
                  title: 'Réactivité exemplaire',
                  desc: 'Réponses rapides et solutions adaptées à vos besoins urgents',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  accent: 'violet'
                }
              ].map((value, idx) => {
                const accentColors = {
                  emerald: {
                    text: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-200',
                    hover: 'hover:border-emerald-400',
                    iconColor: 'text-emerald-600'
                  },
                  blue: {
                    text: 'text-blue-600',
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    hover: 'hover:border-blue-400',
                    iconColor: 'text-blue-600'
                  },
                  amber: {
                    text: 'text-amber-600',
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    hover: 'hover:border-amber-400',
                    iconColor: 'text-amber-600'
                  },
                  violet: {
                    text: 'text-violet-600',
                    bg: 'bg-violet-50',
                    border: 'border-violet-200',
                    hover: 'hover:border-violet-400',
                    iconColor: 'text-violet-600'
                  }
                };
                const colors = accentColors[value.accent as keyof typeof accentColors];
                
                return (
                  <div
                    key={idx}
                    className={`group p-5 rounded-lg border ${colors.border} ${colors.hover} bg-white transition-all duration-300 hover:shadow-md`}
                  >
                    <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center ${colors.iconColor} mb-3 transition-transform duration-300 group-hover:scale-110`}>
                      {value.icon}
                    </div>
                    <h3 className={`text-lg font-semibold ${colors.text} mb-2`}>
                      {value.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Section - Beautiful Design */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left Column - Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold mb-5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Notre expertise
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
                  Des compétences reconnues
                </h2>
                <p className="text-base text-gray-600 mb-4 leading-relaxed">
                  Au service de votre réussite, nous mettons notre <strong className="text-gray-900">expertise</strong> et notre savoir-faire à votre disposition pour répondre à tous vos besoins en produits professionnels.
                </p>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Notre expérience solide et notre réseau de partenaires privilégiés nous permettent de vous offrir un accès exclusif aux meilleures marques du marché, avec un service personnalisé et une réactivité exceptionnelle.
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  {[
                    { number: '15+', label: 'Années' },
                    { number: '1000+', label: 'Clients' },
                    { number: '4', label: 'Marques' }
                  ].map((stat, idx) => (
                    <div key={idx} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="text-2xl font-black text-emerald-600 mb-1">{stat.number}</div>
                      <div className="text-xs text-gray-600 font-semibold">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Features Card */}
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-emerald-200 to-emerald-100 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-emerald-50 to-white p-8 rounded-2xl border-2 border-emerald-100 shadow-xl">
                  <h3 className="text-xl font-black text-gray-900 mb-6">
                    Pourquoi nous choisir ?
                  </h3>
                  <div className="space-y-4">
                    {[
                      'Accès privilégié aux meilleures marques du marché',
                      'Réseau de fournisseurs certifiés et fiables',
                      'Conseil technique personnalisé par des experts',
                      'Suivi de commande en temps réel',
                      'Garantie complète sur tous nos produits',
                      'Service après-vente réactif et efficace'
                    ].map((point, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-emerald-200 text-center">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Expertise certifiée</p>
                    <p className="text-emerald-600 font-bold text-sm">Des professionnels qualifiés à votre service</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-32 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                Contactez-nous
              </h2>
              <p className="text-xl text-gray-600">
                Nous sommes à votre disposition pour répondre à toutes vos questions
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <a
                href="tel:+352691775623"
                className="group p-10 bg-gradient-to-br from-green-50 to-white rounded-3xl border-2 border-green-100 hover:border-green-300 transition-all duration-300 text-center shadow-lg hover:shadow-2xl transform hover:scale-105"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Téléphone</h3>
                <p className="text-green-600 font-semibold text-lg">(+352) 691 775 623</p>
                <p className="text-gray-500 text-sm mt-2">Appelez-nous</p>
              </a>

              <a
                href="mailto:contact@rcmplay-reparation.lu"
                className="group p-10 bg-gradient-to-br from-emerald-50 to-white rounded-3xl border-2 border-emerald-100 hover:border-emerald-300 transition-all duration-300 text-center shadow-lg hover:shadow-2xl transform hover:scale-105"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Email</h3>
                <p className="text-emerald-600 font-semibold text-lg break-all">contact@rcmplay-reparation.lu</p>
                <p className="text-gray-500 text-sm mt-2">Écrivez-nous</p>
              </a>

              <div className="p-10 bg-gradient-to-br from-green-50 to-white rounded-3xl border-2 border-green-100 text-center shadow-lg">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Horaires</h3>
                <p className="text-green-600 font-semibold text-lg">Sur rendez-vous</p>
                <p className="text-gray-500 text-sm mt-2">Service personnalisé</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
            Découvrez notre catalogue et trouvez les produits professionnels dont vous avez besoin
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-3 px-12 py-6 bg-white text-green-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105"
          >
            Explorer le catalogue
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
