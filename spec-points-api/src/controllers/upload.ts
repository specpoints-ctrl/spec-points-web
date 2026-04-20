import { Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AuthRequest } from '../middleware/auth.js';

const ALLOWED_FOLDERS = ['avatars', 'prizes', 'stores'] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

// Railway injects different var names depending on connection style
const env = (keys: string[]): string | undefined =>
  keys.map((k) => process.env[k]).find(Boolean);

const getConfig = () => {
  const endpoint = env(['AWS_ENDPOINT_URL', 'BUCKET_ENDPOINT_URL', 'S3_ENDPOINT_URL']);
  const accessKeyId = env(['AWS_ACCESS_KEY_ID', 'BUCKET_ACCESS_KEY_ID', 'S3_ACCESS_KEY_ID']);
  const secretAccessKey = env(['AWS_SECRET_ACCESS_KEY', 'BUCKET_SECRET_ACCESS_KEY', 'S3_SECRET_ACCESS_KEY']);
  const bucketName = env(['AWS_S3_BUCKET_NAME', 'BUCKET_NAME', 'S3_BUCKET_NAME', 'RAILWAY_BUCKET_NAME']);
  const region = env(['AWS_DEFAULT_REGION', 'BUCKET_REGION', 'S3_REGION']) || 'auto';
  // Optional: separate public base URL (e.g. Railway CDN URL differs from S3 API endpoint)
  const publicUrl = env(['BUCKET_PUBLIC_URL', 'S3_PUBLIC_URL', 'AWS_PUBLIC_URL']);

  const missing = [
    !endpoint && 'AWS_ENDPOINT_URL',
    !accessKeyId && 'AWS_ACCESS_KEY_ID',
    !secretAccessKey && 'AWS_SECRET_ACCESS_KEY',
    !bucketName && 'AWS_S3_BUCKET_NAME',
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Railway Bucket não conectado à API. Variáveis faltando: ${missing.join(', ')}. Conecte o Bucket ao serviço spec-points-api no Railway.`);
  }

  return { endpoint: endpoint!, accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey!, bucketName: bucketName!, region, publicUrl };
};

export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
      return;
    }

    const { endpoint, accessKeyId, secretAccessKey, bucketName, region, publicUrl } = getConfig();

    const folder: UploadFolder = ALLOWED_FOLDERS.includes(req.body.folder as UploadFolder)
      ? (req.body.folder as UploadFolder)
      : 'avatars';

    const uid = req.user?.uid ?? 'anon';
    const ext = (req.file.originalname.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${folder}/${uid}_${Date.now()}.${ext}`;

    const s3 = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: false, // Railway/Tigris requires virtual-hosted-style
    });

    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    // Railway/Tigris public URL format: https://{bucket}.{endpoint-domain}/{key}
    // Override with BUCKET_PUBLIC_URL if needed
    let url: string;
    if (publicUrl) {
      url = `${publicUrl.replace(/\/$/, '')}/${key}`;
    } else {
      // Strip protocol to get domain, then build virtual-hosted-style URL
      const endpointDomain = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
      url = `https://${bucketName}.${endpointDomain}/${key}`;
    }

    res.json({ success: true, data: { url } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload falhou';
    res.status(500).json({ success: false, error: message });
  }
};
