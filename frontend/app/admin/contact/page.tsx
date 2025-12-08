'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { contactApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { BACKEND_URL } from '@/lib/config';
import Link from 'next/link';

export default function AdminContactPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  // Sélectionner automatiquement le message depuis l'URL
  useEffect(() => {
    const messageId = searchParams.get('messageId');
    if (messageId && messages.length > 0) {
      const message = messages.find((msg) => msg._id === messageId);
      if (message) {
        setSelectedMessage(message);
        // Ajuster le filtre si nécessaire pour que le message soit visible
        if (filter === 'unread' && message.isRead) {
          setFilter('all');
        } else if (filter === 'read' && !message.isRead) {
          setFilter('all');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, searchParams]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await contactApi.getAll();
      setMessages(res.data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des messages');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await contactApi.markAsRead(id);
      toast.success('Message marqué comme traité');
      loadMessages();
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage({ ...selectedMessage, isRead: true });
      }
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'unread') return !msg.isRead;
    if (filter === 'read') return msg.isRead;
    return true;
  });

  const unreadCount = messages.filter((msg) => !msg.isRead).length;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mb-4"></div>
            <p className="text-gray-600">Chargement des messages...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Demandes de contact</h1>
          <p className="text-gray-600">
            {messages.length} message{messages.length > 1 ? 's' : ''} au total
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                {unreadCount} non traité{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Tous ({messages.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'unread'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Non traités ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            filter === 'read'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Traités ({messages.length - unreadCount})
        </button>
      </div>

      {/* Liste des messages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste */}
        <div className="lg:col-span-1 space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-gray-500">Aucun message</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message._id}
                onClick={() => setSelectedMessage(message)}
                className={`bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedMessage?._id === message._id
                    ? 'border-green-500'
                    : message.isRead
                    ? 'border-gray-200'
                    : 'border-red-300'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">
                        {message.firstName} {message.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{message.email}</p>
                    </div>
                    {!message.isRead && (
                      <span className="ml-2 flex-shrink-0 w-3 h-3 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">{message.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(message.createdAt)}</span>
                    {message.files && message.files.length > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a2 2 0 00-2.828-2.828L9 10.172 13.172 6l2 2z"
                          />
                        </svg>
                        {message.files.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Détails du message */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* En-tête */}
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedMessage.firstName} {selectedMessage.lastName}
                    </h2>
                    {!selectedMessage.isRead && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        Non traité
                      </span>
                    )}
                    {selectedMessage.isRead && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Traité
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold">Email:</span> {selectedMessage.email}
                    </p>
                    {selectedMessage.phone && (
                      <p>
                        <span className="font-semibold">Téléphone:</span> {selectedMessage.phone}
                      </p>
                    )}
                    {selectedMessage.user && (
                      <p>
                        <span className="font-semibold">Compte:</span> Utilisateur connecté
                        {typeof selectedMessage.user === 'object' && selectedMessage.user.company && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({selectedMessage.user.company.name})
                          </span>
                        )}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">Date:</span> {formatDate(selectedMessage.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {!selectedMessage.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(selectedMessage._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Marquer comme traité
                    </button>
                  )}
                  {selectedMessage.user && (
                    <Link
                      href={`/admin/clients/${typeof selectedMessage.user === 'object' && selectedMessage.user._id ? selectedMessage.user._id : selectedMessage.user}`}
                      className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Voir le profil
                    </Link>
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Message</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Fichiers joints */}
              {selectedMessage.files && selectedMessage.files.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Fichiers joints ({selectedMessage.files.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedMessage.files.map((file: any, index: number) => {
                      // Construire l'URL du fichier
                      const fileUrl = file.path 
                        ? `${BACKEND_URL}${file.path}`
                        : `${BACKEND_URL}/uploads/contact/${file.filename}`;
                      
                      return (
                      <a
                        key={index}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-8 h-8 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.originalName || file.originalname || 'Fichier'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-gray-500">Sélectionnez un message pour voir les détails</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

