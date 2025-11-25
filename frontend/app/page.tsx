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
    <div className="min-h-screen">
      {/* Hero Section Premium */}
      <section className="relative bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 py-24 relative z-10">
          {/* Contact Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16 animate-fade-in">
            <div className="glass rounded-2xl p-6 text-center backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all card-hover">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Besoin d'aide ?</h3>
              <a href="tel:+352691775623" className="text-xl font-bold text-gold-400 hover:text-gold-300 transition-colors">
                (+352) 691 775 623
              </a>
            </div>
            
            <div className="glass rounded-2xl p-6 text-center backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all card-hover">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Nos horaires</h3>
              <p className="text-lg">Uniquement sur rendez-vous</p>
            </div>
            
            <div className="glass rounded-2xl p-6 text-center backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all card-hover">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Contact</h3>
              <a href="mailto:contact@rcmplay-reparation.lu" className="text-lg hover:text-gold-400 transition-colors">
                contact@rcmplay-reparation.lu
              </a>
            </div>
          </div>
          
          {/* Main Hero Content */}
          <div className="text-center max-w-5xl mx-auto animate-slide-up">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="block">RCMPLAY</span>
              <span className="block bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 bg-clip-text text-transparent">
                REPARATION
              </span>
            </h1>
            <p className="text-2xl md:text-3xl mb-12 text-gray-200 font-light max-w-3xl mx-auto leading-relaxed">
              Votre partenaire de confiance pour les produits professionnels au Luxembourg
            </p>
            
            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {[
                { title: 'PRODUITS', desc: 'Toutes marques' },
                { title: 'GARANTIE', desc: '100% garantie' },
                { title: 'EXPERTISE', desc: 'Qualifié à votre service' },
                { title: 'RAPIDITÉ', desc: 'Service rapide et sérieux' }
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className="glass rounded-xl px-6 py-4 backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all card-hover"
                >
                  <p className="font-bold text-sm mb-1">{badge.title}</p>
                  <p className="text-xs text-gray-300">{badge.desc}</p>
                </div>
              ))}
            </div>
            
            <Link
              href="/catalogue"
              className="inline-block bg-gradient-to-r from-gold-500 to-gold-600 text-white px-12 py-5 rounded-xl font-bold text-lg hover:from-gold-600 hover:to-gold-700 transition-all shadow-2xl hover:shadow-gold-500/50 transform hover:scale-105"
            >
              Découvrir le catalogue
            </Link>
          </div>
        </div>
      </section>

      {/* Marques Partenaires - Premium */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Nos <span className="gradient-text">marques partenaires</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Des partenariats exclusifs avec les leaders du marché
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {['Nematic', 'Prinus', 'Bosch', 'Electro Lux'].map((brand, idx) => (
              <div
                key={brand}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 card-hover"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl mx-auto mb-6 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all">
                  <span className="text-4xl font-black text-primary-700">{brand.charAt(0)}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{brand}</h3>
                <p className="text-gray-600 text-center mb-6">Produits professionnels de qualité</p>
                <Link
                  href={`/catalogue?brand=${brand}`}
                  className="block text-center text-primary-600 font-semibold hover:text-primary-700 transition-colors group-hover:underline"
                >
                  Voir les produits →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section - Premium */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-gray-900 mb-6">
              Avec RCMPLAY, l'achat devient <span className="gradient-text">facile</span> !
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Nous vous accompagnons dans le choix de vos produits professionnels avec un service de qualité exceptionnelle
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                num: '01',
                title: 'PAS DE SURPRISE',
                desc: 'Consultez notre catalogue en ligne. Nous vous apportons toutes les informations nécessaires et des prix transparents.',
                icon: '📋'
              },
              {
                num: '02',
                title: 'SOLUTION RAPIDE',
                desc: 'Nos équipes sont spécialisées dans la vente de produits professionnels. Nous vous proposons des solutions adaptées rapidement.',
                icon: '⚡'
              },
              {
                num: '03',
                title: 'INFO CONSTANTE',
                desc: 'Nous vous tenons informés de la disponibilité de vos produits et vous prévenons dès que votre commande est prête.',
                icon: '📱'
              },
              {
                num: '04',
                title: 'QUALITÉ GARANTIE',
                desc: 'Tous nos produits sont garantis. Nous travaillons uniquement avec des marques reconnues pour leur qualité.',
                icon: '✅'
              }
            ].map((step, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 card-hover group"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto transform group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg">
                    {step.num}
                  </div>
                  <div className="absolute -top-2 -right-2 text-4xl opacity-20 group-hover:opacity-30 transition-opacity">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{step.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pièces détachées - Premium */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="animate-slide-up">
              <h2 className="text-5xl font-black mb-8 leading-tight">
                Vente de <span className="text-gold-400">pièces détachées</span>
              </h2>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                En contact avec les grossistes du secteur, RCMPLAY est spécialisée dans la vente de pièces détachées et d'accessoires pour tous vos besoins professionnels.
              </p>
              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                Trouvez votre fournisseur RCMPLAY au Luxembourg pour toutes vos commandes de pièces détachées et accessoires professionnels.
              </p>
              <Link
                href="/catalogue"
                className="inline-block bg-gradient-to-r from-gold-500 to-gold-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-gold-600 hover:to-gold-700 transition-all shadow-2xl hover:shadow-gold-500/50 transform hover:scale-105"
              >
                En savoir plus
              </Link>
            </div>
            <div className="relative">
              <div className="glass rounded-3xl p-12 text-center backdrop-blur-xl border border-white/20 animate-float">
                <div className="w-32 h-32 bg-gradient-to-br from-gold-400 to-gold-600 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-4">Pièces détachées</h3>
                <p className="text-gray-300 text-lg">
                  Large gamme de pièces détachées disponibles sur commande
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Produits en vedette - Premium */}
      {loading ? (
        <div className="text-center py-24 bg-gray-50">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : featuredProducts.length > 0 && (
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-black text-gray-900 mb-4">
                Produits en <span className="gradient-text">vedette</span>
              </h2>
              <p className="text-xl text-gray-600">Découvrez notre sélection de produits premium</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product: any, idx: number) => (
                <Link
                  key={product._id}
                  href={`/produit/${product.slug}`}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 card-hover"
                >
                  {product.images?.[0] && (
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      <img
                        src={`http://localhost:5000${product.images[0].url}`}
                        alt={product.images[0].alt || product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      {product.brand && (
                        <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold">
                          {product.brand}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                      {product.shortDescription}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-3xl font-black text-primary-600">
                        {product.price.toFixed(2)} €
                      </span>
                      <span className="text-primary-600 font-semibold group-hover:translate-x-1 transition-transform inline-block">
                        Voir →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-16">
              <Link
                href="/catalogue"
                className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-12 py-5 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Voir tout le catalogue
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Premium */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            Un besoin ? Une question ? Une précision ?
          </h2>
          <p className="text-2xl mb-12 text-primary-100 max-w-3xl mx-auto">
            Nos équipes sont là pour vous répondre ! Contactez-nous !
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <a
              href="tel:+352691775623"
              className="glass rounded-xl px-10 py-5 font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-xl border border-white/20 hover:border-white/30 card-hover"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                (+352) 691 775 623
              </div>
            </a>
            <a
              href="mailto:contact@rcmplay-reparation.lu"
              className="glass rounded-xl px-10 py-5 font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-xl border border-white/20 hover:border-white/30 card-hover"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contact@rcmplay-reparation.lu
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Statistiques - Premium */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="animate-fade-in">
              <div className="text-6xl font-black text-gold-400 mb-4">0000</div>
              <div className="text-xl text-gray-300 font-medium">Produits disponibles</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-6xl font-black text-gold-400 mb-4">4</div>
              <div className="text-xl text-gray-300 font-medium">Marques partenaires</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-6xl font-black text-gold-400 mb-4">100%</div>
              <div className="text-xl text-gray-300 font-medium">Satisfaction client</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
