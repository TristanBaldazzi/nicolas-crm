'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { settingsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [priceVisibility, setPriceVisibility] = useState<'all' | 'loggedIn' | 'hidden'>('all');
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.get();
      setPriceVisibility(res.data.priceVisibility || 'all');
      setAllowRegistration(res.data.allowRegistration !== undefined ? res.data.allowRegistration : true);
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.update({ priceVisibility, allowRegistration });
      toast.success('Paramètres mis à jour avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-2">Gérez les paramètres généraux de l'application</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Section Visibilité des prix */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Visibilité des prix</h2>
                <p className="text-gray-600 text-sm">
                  Contrôlez qui peut voir les prix des produits sur le site
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-green-300 hover:bg-green-50"
                style={{
                  borderColor: priceVisibility === 'all' ? '#10b981' : '#e5e7eb',
                  backgroundColor: priceVisibility === 'all' ? '#f0fdf4' : 'transparent'
                }}>
                <input
                  type="radio"
                  name="priceVisibility"
                  value="all"
                  checked={priceVisibility === 'all'}
                  onChange={(e) => setPriceVisibility(e.target.value as 'all')}
                  className="mt-1 mr-4"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">Tous les visiteurs</div>
                  <div className="text-sm text-gray-600">
                    Les prix sont visibles pour tous, même les visiteurs non connectés
                  </div>
                </div>
                {priceVisibility === 'all' && (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>

              <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-green-300 hover:bg-green-50"
                style={{
                  borderColor: priceVisibility === 'loggedIn' ? '#10b981' : '#e5e7eb',
                  backgroundColor: priceVisibility === 'loggedIn' ? '#f0fdf4' : 'transparent'
                }}>
                <input
                  type="radio"
                  name="priceVisibility"
                  value="loggedIn"
                  checked={priceVisibility === 'loggedIn'}
                  onChange={(e) => setPriceVisibility(e.target.value as 'loggedIn')}
                  className="mt-1 mr-4"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">Utilisateurs connectés uniquement</div>
                  <div className="text-sm text-gray-600">
                    Seuls les utilisateurs avec un compte peuvent voir les prix
                  </div>
                </div>
                {priceVisibility === 'loggedIn' && (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>

              <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-green-300 hover:bg-green-50"
                style={{
                  borderColor: priceVisibility === 'hidden' ? '#10b981' : '#e5e7eb',
                  backgroundColor: priceVisibility === 'hidden' ? '#f0fdf4' : 'transparent'
                }}>
                <input
                  type="radio"
                  name="priceVisibility"
                  value="hidden"
                  checked={priceVisibility === 'hidden'}
                  onChange={(e) => setPriceVisibility(e.target.value as 'hidden')}
                  className="mt-1 mr-4"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">Prix masqués</div>
                  <div className="text-sm text-gray-600">
                    Les prix ne sont visibles pour personne
                  </div>
                </div>
                {priceVisibility === 'hidden' && (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
            </div>
          </div>

          {/* Section Inscriptions */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Inscriptions</h2>
                <p className="text-gray-600 text-sm">
                  Contrôlez si les utilisateurs peuvent créer un compte par eux-mêmes
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-green-300 hover:bg-green-50"
                style={{
                  borderColor: allowRegistration ? '#10b981' : '#e5e7eb',
                  backgroundColor: allowRegistration ? '#f0fdf4' : 'transparent'
                }}>
                <input
                  type="radio"
                  name="allowRegistration"
                  checked={allowRegistration}
                  onChange={() => setAllowRegistration(true)}
                  className="mt-1 mr-4"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">Inscriptions autorisées</div>
                  <div className="text-sm text-gray-600">
                    Les utilisateurs peuvent créer un compte via la page de connexion
                  </div>
                </div>
                {allowRegistration && (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>

              <label className="flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-red-300 hover:bg-red-50"
                style={{
                  borderColor: !allowRegistration ? '#ef4444' : '#e5e7eb',
                  backgroundColor: !allowRegistration ? '#fef2f2' : 'transparent'
                }}>
                <input
                  type="radio"
                  name="allowRegistration"
                  checked={!allowRegistration}
                  onChange={() => setAllowRegistration(false)}
                  className="mt-1 mr-4"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">Inscriptions désactivées</div>
                  <div className="text-sm text-gray-600">
                    Les utilisateurs ne peuvent plus créer de compte. La page d'inscription sera inaccessible et un message de contact sera affiché sur la page de connexion
                  </div>
                </div>
                {!allowRegistration && (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="p-6 bg-gray-50 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

