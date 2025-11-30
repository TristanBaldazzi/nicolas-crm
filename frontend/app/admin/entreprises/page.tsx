'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { companiesApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await companiesApi.getAll({ limit: 1000 });
      const companiesList = res.data.companies || [];
      setAllCompanies(companiesList);
      setCompanies(companiesList);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterCompanies();
  }, [search, statusFilter, allCompanies]);

  const filterCompanies = () => {
    let filtered = [...allCompanies];

    // Recherche textuelle
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((c) =>
        c.name?.toLowerCase().includes(searchLower) ||
        c.code?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower) ||
        c.city?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre statut
    if (statusFilter === 'active') {
      filtered = filtered.filter((c) => c.isActive !== false);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((c) => c.isActive === false);
    }

    setCompanies(filtered);
  };

  const handleOpenModal = (company?: any) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name || '',
        code: company.code || '',
        address: company.address || '',
        city: company.city || '',
        postalCode: company.postalCode || '',
        country: company.country || 'LU',
        phone: company.phone || '',
        email: company.email || '',
        vatNumber: company.vatNumber || '',
        notes: company.notes || '',
        isActive: company.isActive !== undefined ? company.isActive : true
      });
    } else {
      setEditingCompany(null);
      setFormData({
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
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCompany(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await companiesApi.update(editingCompany._id, formData);
        toast.success('Entreprise mise à jour');
      } else {
        await companiesApi.create(formData);
        toast.success('Entreprise créée');
      }
      handleCloseModal();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      return;
    }
    try {
      await companiesApi.delete(id);
      toast.success('Entreprise supprimée');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  return (
    <AdminLayout>
      {/* Barre de recherche et filtres */}
      {allCompanies.length > 0 && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rechercher</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, code, email, téléphone, ville..."
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filtre statut */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Toutes</option>
                  <option value="active">Actives</option>
                  <option value="inactive">Inactives</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            {(search || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
                className="text-sm text-gray-600 hover:text-green-600 font-semibold flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Réinitialiser
              </button>
            )}
            <div className="ml-auto text-sm text-gray-600">
              <span className="font-semibold">{companies.length}</span> entreprise{companies.length > 1 ? 's' : ''} trouvée{companies.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion des entreprises</h1>
          <p className="text-gray-600 mt-1">{allCompanies.length} entreprise{allCompanies.length > 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          + Nouvelle entreprise
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Nom</th>
              <th className="px-6 py-3 text-left">Code</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Ville</th>
              <th className="px-6 py-3 text-left">Statut</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Chargement...
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Aucune entreprise
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr 
                  key={company._id} 
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/entreprises/${company._id}`)}
                >
                  <td className="px-6 py-4 font-semibold">{company.name}</td>
                  <td className="px-6 py-4">{company.code || '-'}</td>
                  <td className="px-6 py-4">{company.email || '-'}</td>
                  <td className="px-6 py-4">{company.city || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      company.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {company.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          router.push(`/admin/entreprises/${company._id}`);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Voir
                      </button>
                      <button
                        onClick={() => handleOpenModal(company)}
                        className="text-green-600 hover:text-green-800"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(company._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingCompany ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Code postal</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Ville</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Pays</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Numéro TVA</label>
                <input
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-semibold">Active</span>
                </label>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingCompany ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

