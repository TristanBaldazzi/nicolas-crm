'use client';

import { useState, useEffect } from 'react';
import { customQuotesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function DemandePersonnaliseePage() {
  const router = useRouter();
  const { user, loadFromStorage, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pré-remplir les champs si l'utilisateur est connecté
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: '',
        message: ''
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.message) {
      toast.error('Le message est requis');
      return;
    }

    if (formData.message.length > 3500) {
      toast.error('Le message ne peut pas dépasser 3500 caractères');
      return;
    }

    // Si l'utilisateur n'est pas connecté, valider les autres champs
    if (!user) {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }
    }

    setLoading(true);
    try {
      await customQuotesApi.submit({
        firstName: user ? undefined : formData.firstName,
        lastName: user ? undefined : formData.lastName,
        email: user ? undefined : formData.email,
        phone: formData.phone || undefined,
        message: formData.message
      });
      
      toast.success('Votre demande a été envoyée avec succès !');
      
      // Réinitialiser le formulaire
      if (user) {
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: '',
          message: ''
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: ''
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-emerald-50/50 to-green-50 py-16 overflow-hidden border-b border-green-100/50">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_50%)]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Demande d'offre personnalisée
            </h1>
            <p className="text-lg text-gray-600">
              Besoin d'une offre sur mesure ? Décrivez vos besoins et nous vous répondrons rapidement.
            </p>
          </div>
        </div>
      </section>

      {/* Formulaire */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations utilisateur (si connecté) */}
                {user && (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      Votre demande sera liée à votre compte. Vous pouvez ajouter un numéro de téléphone si nécessaire.
                    </p>
                  </div>
                )}

                {/* Nom et Prénom (seulement si non connecté) */}
                {!user && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-bold text-gray-900 mb-2">
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-bold text-gray-900 mb-2">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>
                )}

                {/* Email (seulement si non connecté) */}
                {!user && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                      placeholder="votre@email.com"
                    />
                  </div>
                )}

                {/* Téléphone (optionnel) */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-gray-900 mb-2">
                    Téléphone <span className="text-xs font-normal text-gray-500">(optionnel)</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                    placeholder="+352 691 775 623"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-bold text-gray-900 mb-2">
                    Votre demande <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      ({formData.message.length}/3500 caractères)
                    </span>
                  </label>
                  <textarea
                    id="message"
                    required
                    maxLength={3500}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all resize-none"
                    placeholder="Décrivez en détail vos besoins, les produits recherchés, les quantités, les délais souhaités, etc..."
                  />
                </div>

                {/* Bouton de soumission */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span>Envoyer ma demande</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

