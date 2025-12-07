'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function ProfilPage() {
  const router = useRouter();
  const { user, loadFromStorage, isLoading: authLoading, setAuth } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [trackingConsent, setTrackingConsent] = useState<boolean | null>(null);
  const [savingConsent, setSavingConsent] = useState(false);

  useEffect(() => {
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Initialiser les champs avec les valeurs actuelles
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setTrackingConsent(user.trackingConsent ?? null);
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Le prénom et le nom sont requis');
      return;
    }

    setSaving(true);
    try {
      const res = await authApi.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      setAuth(res.data.user, 'cookie');
      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleConsentChange = async (consent: boolean) => {
    setSavingConsent(true);
    try {
      const res = await authApi.updateTrackingConsent(consent);
      setAuth(res.data.user, 'cookie');
      setTrackingConsent(consent);
      toast.success(consent ? 'Consentement enregistré' : 'Refus enregistré');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSavingConsent(false);
    }
  };

  // Afficher un loader pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 via-green-700 to-green-800 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-4xl md:text-5xl font-black">
                Mon profil
              </h1>
            </div>
            <p className="text-xl text-green-100">
              Gérez vos informations personnelles
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nom complet */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 mb-2">
                    Nom complet
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Prénom"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Nom"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email (désactivé) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-2 text-xs text-gray-500">L'email ne peut pas être modifié</p>
                </div>

                {/* Entreprise (si rattaché) */}
                {user.company && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Entreprise
                    </label>
                    <div className="px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                      <p className="text-gray-900 font-medium">
                        {typeof user.company === 'object' ? user.company.name : user.company}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Vous êtes rattaché à cette entreprise</p>
                  </div>
                )}

                {/* Consentement de tracking */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Confidentialité et suivi d'activité
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Nous collectons des données anonymisées sur votre navigation pour améliorer nos services et analyser la performance de nos produits. Ces données nous permettent de comprendre comment vous utilisez notre site et d'optimiser votre expérience.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-900">
                        <strong>Données collectées :</strong> Pages visitées, produits consultés, ajouts au panier, achats effectués, sources de trafic. Toutes les données sont anonymisées et ne permettent pas de vous identifier personnellement.
                      </p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <p className="text-xs text-gray-600">
                        <strong>Conformité RGPD :</strong> Conformément au Règlement Général sur la Protection des Données (RGPD), vous avez le droit de refuser le suivi de votre activité. Votre choix n'affectera pas votre accès aux services du site.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleConsentChange(true)}
                      disabled={savingConsent || trackingConsent === true}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                        trackingConsent === true
                          ? 'bg-green-600 text-white'
                          : 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {savingConsent && trackingConsent === null ? 'Enregistrement...' : trackingConsent === true ? '✓ Consentement donné' : 'Accepter le suivi'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConsentChange(false)}
                      disabled={savingConsent || trackingConsent === false}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                        trackingConsent === false
                          ? 'bg-red-600 text-white'
                          : 'bg-white border-2 border-red-600 text-red-600 hover:bg-red-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {savingConsent && trackingConsent === null ? 'Enregistrement...' : trackingConsent === false ? '✗ Suivi refusé' : 'Refuser le suivi'}
                    </button>
                  </div>
                  {trackingConsent !== null && (
                    <p className="mt-3 text-xs text-gray-500 text-center">
                      Dernière modification : {user.trackingConsentDate ? new Date(user.trackingConsentDate).toLocaleDateString('fr-FR') : 'Aujourd\'hui'}
                    </p>
                  )}
                </div>

                {/* Boutons */}
                <div className="flex items-center gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all"
                  >
                    Annuler
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

