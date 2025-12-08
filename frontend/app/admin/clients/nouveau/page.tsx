'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { authApi, companiesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function NewClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true,
    company: '',
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await companiesApi.getAll({ limit: 1000 });
      setCompanies(res.data.companies || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleAIGeneration = async () => {
    if (!aiDescription.trim()) {
      toast.error('Veuillez entrer une description du client');
      return;
    }

    setAiLoading(true);
    try {
      const response = await authApi.generateAI(aiDescription.trim());
      const generatedData = response.data;

      // Remplir le formulaire avec les données générées
      setFormData({
        ...formData,
        firstName: generatedData.firstName || formData.firstName,
        lastName: generatedData.lastName || formData.lastName,
        email: generatedData.email || formData.email,
        role: generatedData.role || formData.role,
        isActive: generatedData.isActive !== undefined ? generatedData.isActive : formData.isActive,
      });

      // Fermer le modal
      setShowAIModal(false);
      setAiDescription('');
      
      toast.success('Client généré avec succès ! Complétez les informations manquantes (mot de passe, entreprise) si nécessaire.');
    } catch (error: any) {
      console.error('Erreur génération IA:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la génération IA. Vérifiez que OPENAI_API_KEY est configurée dans le backend.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password || formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const registerRes = await authApi.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      
      // Récupérer l'ID de l'utilisateur créé
      const userId = registerRes.data.user?.id || registerRes.data.user?._id;
      
      // Si une entreprise est sélectionnée ou si le statut est inactif, mettre à jour l'utilisateur
      if (formData.company || !formData.isActive) {
        const updateData: any = {};
        if (formData.company) {
          updateData.company = formData.company;
        }
        if (!formData.isActive) {
          updateData.isActive = formData.isActive;
        }
        
        if (userId && Object.keys(updateData).length > 0) {
          await authApi.updateUser(userId, updateData);
        }
      }
      
      toast.success('Client créé avec succès');
      router.push('/admin/clients');
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
            href="/admin/clients"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux clients
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Nouveau client</h1>
              <p className="text-gray-600 mt-1">Créez un nouveau client dans le système</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Générer avec IA
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Informations du client</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  placeholder="Prénom"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  placeholder="Nom"
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                placeholder="email@exemple.com"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-700">
                Mot de passe *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                placeholder="Minimum 6 caractères"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Le mot de passe doit contenir au moins 6 caractères</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Rôle *
                </label>
                <CustomSelect
                  options={[
                    { value: 'user', label: 'Utilisateur' },
                    { value: 'admin', label: 'Administrateur' },
                  ]}
                  value={formData.role}
                  onChange={(value) => setFormData({ ...formData, role: value })}
                  placeholder="Sélectionner un rôle"
                  searchable={false}
                  className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Entreprise
                </label>
                {loadingCompanies ? (
                  <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-green-600"></div>
                  </div>
                ) : (
                  <CustomSelect
                    options={[
                      { value: '', label: 'Aucune entreprise' },
                      ...companies.map((company) => ({
                        value: company._id,
                        label: company.name,
                      })),
                    ]}
                    value={formData.company}
                    onChange={(value) => setFormData({ ...formData, company: value })}
                    placeholder="Sélectionner une entreprise"
                    searchable={true}
                    className="shadow-sm hover:shadow-md focus-within:shadow-lg"
                  />
                )}
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-6 h-6 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer transition-all"
                  />
                  {formData.isActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-base font-bold text-gray-900 block">Compte actif</span>
                  <span className="text-xs text-gray-600 mt-0.5">
                    {formData.isActive ? 'Le compte est actuellement actif' : 'Le compte est actuellement inactif'}
                  </span>
                </div>
                <div className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  formData.isActive
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {formData.isActive ? 'Actif' : 'Inactif'}
                </div>
              </label>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin/clients"
                className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all text-center"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer le client'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal IA */}
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
                  <p className="text-purple-100 mt-1">Décrivez votre client et l'IA remplira automatiquement les informations</p>
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
                  Description du client
                </label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="Exemple: Jean Dupont, directeur technique chez TechCorp, email jean.dupont@techcorp.lu, actif, rôle utilisateur..."
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

