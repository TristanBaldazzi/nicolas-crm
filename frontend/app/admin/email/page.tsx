'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { emailApi, clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminEmailPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    recipientType: 'all',
    recipients: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [campaignsRes, clientsRes] = await Promise.all([
        emailApi.getAll(),
        clientsApi.getAll({ limit: 1000 }),
      ]);
      setCampaigns(campaignsRes.data || []);
      setClients(clientsRes.data.clients || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        recipients: formData.recipientType === 'all' ? [] : formData.recipients,
      };

      if (editingCampaign) {
        await emailApi.update(editingCampaign._id, data);
        toast.success('Campagne modifiée');
      } else {
        await emailApi.create(data);
        toast.success('Campagne créée');
      }

      setShowForm(false);
      setEditingCampaign(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      content: '',
      recipientType: 'all',
      recipients: [],
    });
  };

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      subject: campaign.subject,
      content: campaign.content,
      recipientType: campaign.recipientType,
      recipients: campaign.recipients?.map((r: any) => r._id || r) || [],
    });
    setShowForm(true);
  };

  const handleSend = async (id: string) => {
    if (!confirm('Envoyer cette campagne maintenant ?')) return;
    try {
      await emailApi.send(id);
      toast.success('Envoi de la campagne démarré');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    try {
      await emailApi.delete(id);
      toast.success('Campagne supprimée');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Email Marketing</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCampaign(null);
            resetForm();
          }}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          + Nouvelle campagne
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {editingCampaign ? 'Modifier' : 'Créer'} une campagne
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Nom de la campagne *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block mb-1">Sujet *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block mb-1">Destinataires</label>
              <select
                value={formData.recipientType}
                onChange={(e) => setFormData({ ...formData, recipientType: e.target.value, recipients: [] })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="all">Tous les clients</option>
                <option value="selected">Clients sélectionnés</option>
              </select>
            </div>

            {formData.recipientType === 'selected' && (
              <div>
                <label className="block mb-1">Sélectionner les clients</label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
                  {clients
                    .filter((c) => c.email)
                    .map((client) => (
                      <label key={client._id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={formData.recipients.includes(client._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                recipients: [...formData.recipients, client._id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                recipients: formData.recipients.filter((id) => id !== client._id),
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span>{client.name} ({client.email})</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            <div>
              <label className="block mb-1">Contenu HTML *</label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg font-mono"
                rows={10}
                placeholder="Utilisez {name} pour insérer le nom du client"
              />
              <p className="text-sm text-gray-500 mt-1">
                Utilisez {'{name}'} pour insérer le nom du client
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {editingCampaign ? 'Modifier' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCampaign(null);
                  resetForm();
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {campaigns.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Créez votre première campagne</h3>
            <p className="text-gray-600 mb-8">
              Commencez à communiquer avec vos clients en créant votre première campagne email marketing.
            </p>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingCampaign(null);
                resetForm();
              }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Créer votre première campagne
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Nom</th>
                <th className="px-6 py-3 text-left">Sujet</th>
                <th className="px-6 py-3 text-left">Statut</th>
                <th className="px-6 py-3 text-left">Envoyés</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
              <tr key={campaign._id} className="border-t">
                <td className="px-6 py-4">{campaign.name}</td>
                <td className="px-6 py-4">{campaign.subject}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      campaign.status === 'sent'
                        ? 'bg-green-100 text-green-800'
                        : campaign.status === 'sending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {campaign.sentCount || 0} / {campaign.recipients?.length || 0}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleEdit(campaign)}
                    className="text-blue-600 hover:underline mr-4"
                  >
                    Modifier
                  </button>
                  {campaign.status !== 'sent' && (
                    <button
                      onClick={() => handleSend(campaign._id)}
                      className="text-green-600 hover:underline mr-4"
                    >
                      Envoyer
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(campaign._id)}
                    className="text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}




