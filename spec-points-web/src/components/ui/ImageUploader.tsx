import { useRef, useState } from 'react';
import { Camera, Loader2, ImageIcon, X } from 'lucide-react';
import { resolveAssetUrl, uploadImage, UploadFolder } from '../../lib/api';

interface ImageUploaderProps {
  currentUrl?: string | null;
  folder: UploadFolder;
  onUploaded: (url: string) => void;
  label?: string;
  shape?: 'circle' | 'square';
  placeholder?: React.ReactNode;
}

export default function ImageUploader({
  currentUrl,
  folder,
  onUploaded,
  label = 'Cambiar imagen',
  shape = 'square',
  placeholder,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl ?? resolveAssetUrl(currentUrl);
  const isCircle = shape === 'circle';

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Archivo demasiado grande. Máximo 5 MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      const url = await uploadImage(file, folder, setProgress);
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(url);
      onUploaded(url);
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
      setError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onUploaded('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative group cursor-pointer overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-primary transition-colors ${
          isCircle ? 'rounded-full w-24 h-24' : 'rounded-xl w-full h-40'
        }`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="preview"
              className="w-full h-full object-cover"
              onError={() => setPreviewUrl(null)}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-gray-400">
            {placeholder ?? <ImageIcon className="w-8 h-8" />}
            <span className="text-xs">Haz clic para subirla</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <span className="text-white text-xs font-medium">{progress}%</span>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="text-sm font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? `Subiendo... ${progress}%` : label}
      </button>

      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
