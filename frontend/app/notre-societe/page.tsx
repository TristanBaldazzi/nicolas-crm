'use client';

import Link from 'next/link';

export default function NotreSocietePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Premium */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-green-950 to-gray-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.08),transparent_50%)]"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block mb-8">
              <span className="px-6 py-2 bg-green-500/20 backdrop-blur-xl border border-green-400/30 rounded-full text-green-300 text-sm font-semibold">
                À propos de nous
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              Notre <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent">société</span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
              Votre partenaire de confiance au Luxembourg pour l'excellence en produits professionnels et pièces détachées
            </p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-32 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Leader au Luxembourg
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 leading-tight">
                  RCMPLAY-REPARATION
                </h2>
                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  Depuis notre création, <strong className="text-gray-900">RCMPLAY-REPARATION</strong> s'est imposée comme le partenaire de référence au Luxembourg pour la distribution de produits professionnels et de pièces détachées de qualité supérieure.
                </p>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Notre expertise et notre réseau de partenaires privilégiés nous permettent de vous offrir un accès exclusif aux meilleures marques du marché, avec un service personnalisé et une réactivité exceptionnelle.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Que vous soyez un professionnel recherchant des solutions techniques précises ou un particulier en quête de qualité, nous mettons notre savoir-faire à votre service pour répondre à tous vos besoins.
                </p>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-green-200 to-green-100 rounded-3xl blur-2xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-green-50 to-white p-12 rounded-3xl border-2 border-green-100 shadow-2xl">
                  <div className="grid grid-cols-2 gap-6">
                    {['Nematic', 'Prinus', 'Bosch', 'Electro Lux'].map((brand, idx) => (
                      <div key={brand} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center transform hover:scale-105 transition-transform">
                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                          <span className="text-4xl font-black text-white">{brand.charAt(0)}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">{brand}</h4>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-8 border-t border-green-200 text-center">
                    <p className="text-sm text-gray-600 font-semibold mb-2">Nos partenaires exclusifs</p>
                    <p className="text-green-600 font-bold">Marques leaders du secteur</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-32 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                Notre <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">engagement</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Des valeurs fortes qui guident chacune de nos actions
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Mission */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                <div className="relative bg-white p-12 rounded-3xl shadow-xl border border-gray-100 h-full">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-8 transform group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-6">Notre mission</h3>
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">
                    Fournir à nos clients des produits professionnels de la plus haute qualité, en garantissant un service client irréprochable, des prix transparents et une réactivité exemplaire.
                  </p>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Nous nous engageons à être votre partenaire de confiance, en vous accompagnant à chaque étape de votre projet avec expertise et professionnalisme.
                  </p>
                </div>
              </div>

              {/* Vision */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
                <div className="relative bg-white p-12 rounded-3xl shadow-xl border border-gray-100 h-full">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-8 transform group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-6">Notre vision</h3>
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">
                    Devenir la référence incontournable au Luxembourg pour tous les professionnels et particuliers recherchant l'excellence en matière de produits techniques et de pièces détachées.
                  </p>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Nous aspirons à construire des relations durables basées sur la confiance, la qualité et l'innovation constante pour répondre aux défis de demain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valeurs Section */}
      <section className="py-32 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
                Nos <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">valeurs</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Les principes qui guident notre quotidien et façonnent notre excellence
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: 'Qualité garantie',
                  desc: 'Uniquement des produits de marques reconnues et certifiées, avec garantie complète',
                  gradient: 'from-emerald-500 to-teal-500'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ),
                  title: 'Service de proximité',
                  desc: 'Un accompagnement personnalisé et un suivi dédié pour chaque client',
                  gradient: 'from-blue-500 to-cyan-500'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Transparence totale',
                  desc: 'Prix clairs et détaillés, sans surprise ni frais cachés',
                  gradient: 'from-amber-500 to-orange-500'
                },
                {
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'Réactivité exemplaire',
                  desc: 'Réponses rapides et solutions adaptées à vos besoins urgents',
                  gradient: 'from-violet-500 to-purple-500'
                }
              ].map((value, idx) => (
                <div
                  key={idx}
                  className="group relative"
                >
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${value.gradient} rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`}></div>
                  <div className="relative bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 h-full">
                    <div className={`w-16 h-16 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-6 text-white transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{value.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-32 bg-gradient-to-br from-gray-900 via-green-950 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black mb-6">
                Notre <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">expertise</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Des compétences reconnues au service de votre réussite
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  number: '15+',
                  title: 'Années d\'expérience',
                  desc: 'Une expertise solide acquise au fil des années'
                },
                {
                  number: '1000+',
                  title: 'Clients satisfaits',
                  desc: 'Une base de clients fidèles et confiants'
                },
                {
                  number: '4',
                  title: 'Marques partenaires',
                  desc: 'Relations privilégiées avec les leaders du marché'
                }
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="text-center p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="text-6xl font-black bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent mb-4">
                    {stat.number}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{stat.title}</h3>
                  <p className="text-gray-300">{stat.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-20 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-4xl font-black mb-6">Pourquoi nous choisir ?</h3>
                <div className="space-y-6">
                  {[
                    'Accès privilégié aux meilleures marques du marché',
                    'Réseau de fournisseurs certifiés et fiables',
                    'Conseil technique personnalisé par des experts',
                    'Suivi de commande en temps réel',
                    'Garantie complète sur tous nos produits',
                    'Service après-vente réactif et efficace'
                  ].map((point, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-lg text-gray-300 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="relative p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl">
                  <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-3xl blur-2xl"></div>
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <h4 className="text-2xl font-bold mb-4 text-center">Expertise certifiée</h4>
                    <p className="text-gray-300 text-center text-lg">
                      Des professionnels qualifiés à votre service
                    </p>
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

            <div className="mt-16 text-center">
              <div className="inline-block p-8 bg-gradient-to-br from-green-50 to-white rounded-3xl border-2 border-green-100 shadow-xl">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h4 className="text-xl font-bold text-gray-900">Notre localisation</h4>
                </div>
                <p className="text-lg text-gray-600 font-semibold">BERTRANGE, Luxembourg</p>
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
