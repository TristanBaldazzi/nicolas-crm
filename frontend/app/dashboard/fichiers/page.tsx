'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { clientFilesApi } from '@/lib/api';
import { BACKEND_URL } from '@/lib/config';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ClientFilesPage() {
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && user.id) {
      loadFiles();
    } else if (user === null) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadFiles = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const res = await clientFilesApi.getPublicByUser(user.id);
      setFiles(res.data.files || []);
    } catch (error: any) {
      console.error('Error loading files:', error);
      toast.error('Erreur lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimetype.includes('pdf')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  const isImage = (mimetype: string) => mimetype.startsWith('image/');
  const isVideo = (mimetype: string) => mimetype.startsWith('video/');

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour au tableau de bord
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Mes fichiers</h1>
            <p className="text-gray-600 mt-2">Fichiers partagés par l'administrateur</p>
          </div>

          {loading ? (
            <div className="text-center py-32">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600"></div>
              <p className="mt-6 text-gray-600 text-lg font-medium">Chargement...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun fichier disponible</h3>
              <p className="text-sm text-gray-600 mb-3 max-w-md mx-auto">
                Aucun fichier public n'a été partagé avec vous pour le moment.
              </p>
              <p className="text-xs text-gray-500 max-w-md mx-auto mb-3">
                Les fichiers partagés par l'administrateur apparaîtront automatiquement ici une fois qu'ils auront été rendus publics. Vous pourrez alors les consulter et les télécharger directement depuis cette page.
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Vous serez notifié lorsque de nouveaux fichiers seront disponibles</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {files.map((file: any) => {
                const fileUrl = `${BACKEND_URL}${file.path}`;
                const showPreview = isImage(file.mimetype) || isVideo(file.mimetype);
                
                return (
                  <div
                    key={file._id}
                    className="bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Aperçu image/vidéo */}
                    {showPreview && (
                      <div className="w-full aspect-video bg-gray-100 relative overflow-hidden">
                        {isImage(file.mimetype) ? (
                          <img
                            src={fileUrl}
                            alt={file.originalName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : isVideo(file.mimetype) ? (
                          <video
                            src={fileUrl}
                            className="w-full h-full object-cover"
                            controls={false}
                            preload="metadata"
                          >
                            Votre navigateur ne supporte pas la lecture de vidéos.
                          </video>
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        {!showPreview && (
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 flex-shrink-0">
                            {getFileIcon(file.mimetype)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate mb-1">{file.originalName}</h3>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          {new Date(file.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Télécharger
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

