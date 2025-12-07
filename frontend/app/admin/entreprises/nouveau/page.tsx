'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { companiesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewCompanyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'LU',
    phone: '',
    email: '',
    vatNumber: '',
    notes: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAIGeneration = async () => {
    if (!aiDescription.trim()) {
      toast.error('Veuillez entrer une description de l\'entreprise');
      return;
    }

    setAiLoading(true);
    try {
      const response = await companiesApi.generateAI(aiDescription.trim(), formData);
      const generatedData = response.data;

      // Fusionner les données : ne remplacer que les champs vides
      setFormData(prev => ({
        name: (prev.name && prev.name.trim()) ? prev.name : (generatedData.name || ''),
        code: (prev.code && prev.code.trim()) ? prev.code : (generatedData.code || ''),
        address: (prev.address && prev.address.trim()) ? prev.address : (generatedData.address || ''),
        city: (prev.city && prev.city.trim()) ? prev.city : (generatedData.city || ''),
        postalCode: (prev.postalCode && prev.postalCode.trim()) ? prev.postalCode : (generatedData.postalCode || ''),
        country: (prev.country && prev.country.trim()) ? prev.country : (generatedData.country || 'LU'),
        phone: (prev.phone && prev.phone.trim()) ? prev.phone : (generatedData.phone || ''),
        email: (prev.email && prev.email.trim()) ? prev.email : (generatedData.email || ''),
        vatNumber: (prev.vatNumber && prev.vatNumber.trim()) ? prev.vatNumber : (generatedData.vatNumber || ''),
        notes: (prev.notes && prev.notes.trim()) ? prev.notes : (generatedData.notes || ''),
        isActive: prev.isActive,
      }));

      setShowAIModal(false);
      setAiDescription('');
      toast.success('Informations générées avec succès ! Vérifiez et complétez si nécessaire.');
    } catch (error: any) {
      console.error('Erreur génération IA:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la génération IA. Vérifiez que OPENAI_API_KEY est configurée dans le backend.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await companiesApi.create(formData);
      toast.success('Entreprise créée avec succès');
      router.push('/admin/entreprises');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/entreprises"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux entreprises
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Nouvelle entreprise</h1>
              <p className="text-gray-600 mt-1">Créez une nouvelle entreprise dans le système</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Génération IA
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Adresse</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Code postal</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Ville</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Pays</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Téléphone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Numéro TVA</label>
              <input
                type="text"
                value={formData.vatNumber}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all resize-none"
                rows={4}
              />
            </div>

            {/* Statut de l'entreprise */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Statut de l'entreprise</h3>
              <label className="flex items-center p-4 bg-white rounded-lg border cursor-pointer transition-all hover:border-green-300 hover:bg-green-50"
                style={{
                  borderColor: formData.isActive ? '#10b981' : '#e5e7eb',
                  backgroundColor: formData.isActive ? '#f0fdf4' : 'white'
                }}>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    formData.isActive 
                      ? 'bg-green-600 border-green-600' 
                      : 'bg-white border-gray-300'
                  }`}>
                    {formData.isActive && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900">Entreprise active</span>
                    {formData.isActive && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Activée
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.isActive 
                      ? 'L\'entreprise est active et visible dans le système'
                      : 'L\'entreprise est inactive et masquée dans le système'}
                  </p>
                </div>
                {formData.isActive && (
                  <div className="ml-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </label>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin/entreprises"
                className="px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer l\'entreprise'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Génération IA */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 border-b border-purple-500 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Génération IA
                  </h2>
                  <p className="text-purple-100 mt-1">Décrivez l'entreprise et l'IA remplira automatiquement les informations</p>
                </div>
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiDescription('');
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description de l'entreprise
                </label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Exemple: Entreprise TechCorp, située à Luxembourg, code postal 1234, email contact@techcorp.lu, téléphone +352 123 456 789, numéro TVA LU12345678..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm min-h-[200px] resize-y"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Plus vous donnez de détails, plus l'IA pourra remplir précisément les champs
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAIModal(false);
                    setAiDescription('');
                  }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAIGeneration}
                  disabled={!aiDescription.trim() || aiLoading}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Générer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

