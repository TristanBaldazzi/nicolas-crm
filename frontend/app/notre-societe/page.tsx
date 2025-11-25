'use client';

export default function NotreSocietePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-6xl md:text-7xl font-black mb-6 text-center">
            Notre <span className="bg-gradient-to-r from-gold-400 via-gold-300 to-gold-500 bg-clip-text text-transparent">société</span>
          </h1>
          <p className="text-2xl text-center text-gray-300 max-w-3xl mx-auto">
            Votre partenaire de confiance au Luxembourg
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* About Section */}
            <div className="bg-white rounded-3xl shadow-2xl p-12 md:p-16 mb-12 border border-gray-100">
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center mr-6">
                  <span className="text-white font-black text-2xl">R</span>
                </div>
                <h2 className="text-4xl font-black text-gray-900">
                  RCMPLAY-REPARATION
                </h2>
              </div>
              
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p>
                  <strong className="text-gray-900">RCMPLAY-REPARATION</strong> est votre partenaire de confiance au Luxembourg pour la vente de produits professionnels et de pièces détachées.
                </p>
                <p>
                  Spécialisés dans la distribution de produits de qualité, nous travaillons avec les plus grandes marques du secteur : <span className="font-semibold text-primary-600">Nematic</span>, <span className="font-semibold text-primary-600">Prinus</span>, <span className="font-semibold text-primary-600">Bosch</span> et <span className="font-semibold text-primary-600">Electro Lux</span>.
                </p>
                <p>
                  Notre équipe est à votre service pour vous conseiller et vous accompagner dans le choix de vos produits professionnels. Nous garantissons un service rapide, sérieux et de qualité.
                </p>
              </div>
            </div>

            {/* Mission & Values Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-10 shadow-xl border border-primary-100 card-hover">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4">Notre mission</h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Fournir à nos clients des produits professionnels de qualité, avec un service client irréprochable et des prix transparents.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gold-50 to-white rounded-2xl p-10 shadow-xl border border-gold-100 card-hover">
                <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4">Nos valeurs</h3>
                <ul className="space-y-3 text-gray-700 text-lg">
                  <li className="flex items-center">
                    <svg className="w-6 h-6 text-gold-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Qualité garantie
                  </li>
                  <li className="flex items-center">
                    <svg className="w-6 h-6 text-gold-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Service client de proximité
                  </li>
                  <li className="flex items-center">
                    <svg className="w-6 h-6 text-gold-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Transparence des prix
                  </li>
                  <li className="flex items-center">
                    <svg className="w-6 h-6 text-gold-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Réactivité et professionnalisme
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '40px 40px'
                }}></div>
              </div>
              <div className="relative z-10 text-center">
                <h3 className="text-4xl font-black mb-8">Contactez-nous</h3>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="glass rounded-2xl p-6 backdrop-blur-xl border border-white/20">
                    <svg className="w-10 h-10 mx-auto mb-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-lg font-semibold mb-2">Adresse</p>
                    <p className="text-gray-300">BERTRANGE, Luxembourg</p>
                  </div>
                  <div className="glass rounded-2xl p-6 backdrop-blur-xl border border-white/20">
                    <svg className="w-10 h-10 mx-auto mb-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <p className="text-lg font-semibold mb-2">Téléphone</p>
                    <a href="tel:+352691775623" className="text-gold-400 hover:text-gold-300 transition-colors font-semibold">
                      (+352) 691 775 623
                    </a>
                  </div>
                  <div className="glass rounded-2xl p-6 backdrop-blur-xl border border-white/20">
                    <svg className="w-10 h-10 mx-auto mb-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-semibold mb-2">Email</p>
                    <a href="mailto:contact@rcmplay-reparation.lu" className="text-gold-400 hover:text-gold-300 transition-colors">
                      contact@rcmplay-reparation.lu
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
