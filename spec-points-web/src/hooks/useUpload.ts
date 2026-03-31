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
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File must be less than 5MB');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image (JPEG, PNG, WebP, etc.)');
      }

      const storage = getStorage();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const fileRef = ref(storage, `${path}/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(fileRef, file);

      // Get download URL
      const url = await getDownloadURL(snapshot.ref);

      setProgress(null);
      setUploading(false);

      return url;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setUploading(false);
      throw err;
    }
  }, []);

  const deleteFile = useCallback(async (url: string) => {
    try {
      setError(null);
      const storage = getStorage();

      // Extract path from URL
      const baseUrl = url.split('?')[0]; // Remove query params
      const decodedPath = decodeURIComponent(baseUrl.split('/o/')[1]);

      const fileRef = ref(storage, decodedPath);
      await deleteObject(fileRef);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return { uploading, progress, error, uploadFile, deleteFile };
};
