'use client';

import { useState, useEffect } from 'react';
import { contactApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const { user, loadFromStorage } = useAuthStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalSize, setTotalSize] = useState(0);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const maxFiles = 10;
    const maxTotalSize = 100 * 1024 * 1024; // 100MB

    // Vérifier le nombre de fichiers
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Vous ne pouvez pas ajouter plus de ${maxFiles} fichiers`);
      return;
    }

    // Calculer la nouvelle taille totale
    const newFilesSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const newTotalSize = totalSize + newFilesSize;

    if (newTotalSize > maxTotalSize) {
      toast.error('La taille totale des fichiers ne peut pas dépasser 100 Mo');
      return;
    }

    setFiles([...files, ...selectedFiles]);
    setTotalSize(newTotalSize);
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    setFiles(files.filter((_, i) => i !== index));
    setTotalSize(totalSize - fileToRemove.size);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.message) {
      toast.error('Le message est requis');
      return;
    }

    if (formData.message.length > 2500) {
      toast.error('Le message ne peut pas dépasser 2500 caractères');
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
      const formDataToSend = new FormData();
      
      // Si l'utilisateur n'est pas connecté, envoyer les infos
      if (!user) {
        formDataToSend.append('firstName', formData.firstName);
        formDataToSend.append('lastName', formData.lastName);
        formDataToSend.append('email', formData.email);
      }
      
      if (formData.phone) {
        formDataToSend.append('phone', formData.phone);
      }
      formDataToSend.append('message', formData.message);

      // Ajouter les fichiers
      files.forEach((file) => {
        formDataToSend.append('files', file);
      });

      await contactApi.submit(formDataToSend);
      toast.success('Votre message a été envoyé avec succès !');
      
      // Réinitialiser le formulaire
      if (user) {
        // Si connecté, garder les infos utilisateur, vider seulement le message et le téléphone
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: '',
          message: ''
        });
      } else {
        // Si non connecté, tout vider
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          message: ''
        });
      }
      setFiles([]);
      setTotalSize(0);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi du message');
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
              Contactez-nous
            </h1>
            <p className="text-lg text-gray-600">
              Une question ? Un besoin spécifique ? Notre équipe est là pour vous aider.
            </p>
          </div>
        </div>
      </section>

      {/* Formulaire de contact */}
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
                      Votre message sera lié à votre compte. Vous pouvez ajouter un numéro de téléphone si nécessaire.
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

                {/* Email (seulement si non connecté) et Téléphone */}
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

                {/* Téléphone (optionnel pour tous) */}
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
                    Message <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      ({formData.message.length}/2500 caractères)
                    </span>
                  </label>
                  <textarea
                    id="message"
                    required
                    maxLength={2500}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all resize-none"
                    placeholder="Décrivez votre demande, question ou besoin..."
                  />
                </div>

                {/* Upload de fichiers */}
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Fichiers joints (optionnel)
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      Max 10 fichiers, 100 Mo au total
                    </span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-green-400 transition-colors">
                    <input
                      type="file"
                      id="files"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept="*/*"
                    />
                    <label
                      htmlFor="files"
                      className="cursor-pointer flex flex-col items-center justify-center gap-3"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <span className="text-green-600 font-semibold">Cliquez pour ajouter des fichiers</span>
                        <p className="text-xs text-gray-500 mt-1">
                          ou glissez-déposez vos fichiers ici
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Liste des fichiers */}
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="ml-4 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <div className="text-xs text-gray-500 mt-2">
                        {files.length} fichier{files.length > 1 ? 's' : ''} • {formatFileSize(totalSize)} / 100 MB
                      </div>
                    </div>
                  )}
                </div>

                {/* Bouton de soumission */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Envoi en cours...' : 'Envoyer le message'}
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

