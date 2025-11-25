'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productsApi, categoriesApi } from '@/lib/api';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
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
      {/* Hero Section - Ultra Moderne */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-green-950 to-gray-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.08),transparent_50%)]"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          {/* Main Hero Content */}
          <div className="text-center max-w-6xl mx-auto">
            <div className="inline-block mb-8">
              <span className="px-6 py-2 bg-green-500/20 backdrop-blur-xl border border-green-400/30 rounded-full text-green-300 text-sm font-semibold">
                Votre partenaire de confiance au Luxembourg
              </span>
            </div>
            
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black mb-8 leading-[0.9] tracking-tight">
              <span className="block text-white">RCMPLAY</span>
              <span className="block bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                REPARATION
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl mb-16 text-gray-300 font-light max-w-4xl mx-auto leading-relaxed">
              Excellence en produits professionnels et pièces détachées
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-6 mb-20">
              <Link
                href="/catalogue"
                className="group relative px-10 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-bold text-lg overflow-hidden shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Découvrir le catalogue
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <Link
                href="/notre-societe"
                className="px-10 py-5 bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/20 hover:border-white/50 transition-all duration-300"
              >
                Notre société
              </Link>
            </div>

            {/* Value Propositions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { 
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ), 
                  title: 'Garantie', 
                  desc: '100%' 
                },
                { 
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ), 
                  title: 'Rapidité', 
                  desc: 'Service express' 
                },
                { 
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ), 
                  title: 'Expertise', 
                  desc: 'Qualifiée' 
                },
                { 
                  icon: (
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  ), 
                  title: 'Qualité', 
                  desc: 'Premium' 
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="group p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                >
                  <div className="text-white mb-3 flex justify-center">{item.icon}</div>
                  <div className="text-white font-bold text-lg mb-1">{item.title}</div>
                  <div className="text-gray-400 text-sm">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
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
            {['Nematic', 'Prinus', 'Bosch', 'Electro Lux'].map((brand, idx) => (
              <Link
                key={brand}
                href={`/catalogue?brand=${brand}`}
                className="group relative p-10 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="w-28 h-28 bg-gradient-to-br from-green-500 to-green-700 rounded-3xl mx-auto mb-6 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                    <span className="text-5xl font-black text-white">{brand.charAt(0)}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center group-hover:text-green-600 transition-colors">{brand}</h3>
                  <p className="text-gray-600 text-center mb-6">Produits professionnels</p>
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

      {/* Avantages Section - Design Moderne */}
      <section className="py-32 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Pourquoi choisir <span className="bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">RCMPLAY</span> ?
            </h2>
            <p className="text-xl text-gray-600">
              Des avantages qui font la différence
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: 'Prix transparents',
                desc: 'Consultez notre catalogue en ligne avec toutes les informations et prix transparents, sans surprise.',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                title: 'Service rapide',
                desc: 'Nos équipes spécialisées vous proposent des solutions adaptées rapidement pour répondre à vos besoins.',
                gradient: 'from-amber-500 to-orange-500'
              },
              {
                title: 'Suivi personnalisé',
                desc: 'Nous vous tenons informés de la disponibilité de vos produits et vous prévenons dès que votre commande est prête.',
                gradient: 'from-emerald-500 to-teal-500'
              },
              {
                title: 'Qualité garantie',
                desc: 'Tous nos produits sont garantis. Nous travaillons uniquement avec des marques reconnues pour leur qualité.',
                gradient: 'from-violet-500 to-purple-500'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="group relative"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.gradient} rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`}></div>
                <div className="relative bg-white p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100 h-full">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{item.desc}</p>
                </div>
              </div>
            ))}
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
                      {['Nematic', 'Prinus', 'Bosch', 'Electro Lux'].map((brand, idx) => (
                        <div key={brand} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                            <span className="text-3xl font-black text-white">{brand.charAt(0)}</span>
                          </div>
                          <h4 className="font-bold text-gray-900">{brand}</h4>
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
                          src={`http://localhost:5000${product.images[0].url}`}
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

      {/* CTA Section - Design Premium */}
      <section className="py-32 bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight">
            Un besoin ? Une question ?
          </h2>
          <p className="text-2xl md:text-3xl mb-16 text-green-100 max-w-3xl mx-auto">
            Nos équipes sont là pour vous répondre !
          </p>
        </div>
      </section>

      {/* Statistiques - Section Moderne */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-green-950 to-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="group">
              <div className="text-7xl font-black bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent mb-4">
                0000
              </div>
              <div className="text-xl text-gray-300 font-medium">Produits disponibles</div>
            </div>
            <div className="group">
              <div className="text-7xl font-black bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent mb-4">
                4
              </div>
              <div className="text-xl text-gray-300 font-medium">Marques partenaires</div>
            </div>
            <div className="group">
              <div className="text-7xl font-black bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent mb-4">
                100%
              </div>
              <div className="text-xl text-gray-300 font-medium">Satisfaction client</div>
            </div>
          </div>
        </div>
      </section>

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
                <p className="text-emerald-600 font-semibold text-lg break-all">contact@rcmplay-reparation.lu</p>
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
