import { useState, useCallback } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface UploadProgress {
  loaded: number;
  total: number;
}

interface UseUploadResult {
  uploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  uploadFile: (file: File, path: string) => Promise<string>;
  deleteFile: (url: string) => Promise<void>;
}

export const useUpload = (): UseUploadResult => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File, path: string): Promise<string> => {
    setError(null);
    setProgress({ loaded: 0, total: file.size });
    setUploading(true);

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('El archivo debe pesar menos de 5 MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen válida');
      }

      const storage = getStorage();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const fileRef = ref(storage, `${path}/${fileName}`);

      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);

      setProgress(null);
      setUploading(false);

      return url;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error de carga';
      setError(errorMessage);
      setUploading(false);
      throw err;
    }
  }, []);

  const deleteFile = useCallback(async (url: string) => {
    try {
      setError(null);
      const storage = getStorage();
      const baseUrl = url.split('?')[0];
      const decodedPath = decodeURIComponent(baseUrl.split('/o/')[1]);

      const fileRef = ref(storage, decodedPath);
      await deleteObject(fileRef);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar el archivo';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return { uploading, progress, error, uploadFile, deleteFile };
};
