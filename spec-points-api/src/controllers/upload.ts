import { Readable } from 'stream';
import { Response } from 'express';
import { GetObjectCommand, PutBucketPolicyCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AuthRequest } from '../middleware/auth.js';
import { toPublicAssetUrl } from '../middleware/asset-urls.js';

const ALLOWED_FOLDERS = ['avatars', 'prizes', 'stores', 'receipts'] as const;
type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

// Railway injects different var names depending on connection style
const env = (keys: string[]): string | undefined =>
  keys.map((k) => process.env[k]).find(Boolean);

const extractObjectKey = (value: string): string | null => {
  if (!value) return null;

  if (!/^https?:\/\//i.test(value)) {
    const normalized = value.replace(/^\/+/, '');
    return normalized || null;
  }

  try {
    const parsed = new URL(value);
    const normalized = decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
    return normalized || null;
  } catch {
    return null;
  }
};

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

    // Railway buckets are private, so clients should read via the API proxy route.
    const url = publicUrl
      ? `${publicUrl.replace(/\/$/, '')}/${key}`
      : (toPublicAssetUrl(req, key) ?? key);

    res.json({ success: true, data: { url } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload falhou';
    res.status(500).json({ success: false, error: message });
  }
};

export const getUploadedFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawKey = req.params[0];
    const key = rawKey ? extractObjectKey(rawKey) : null;

    if (!key) {
      res.status(400).json({ success: false, error: 'Arquivo invalido' });
      return;
    }

    const { endpoint, accessKeyId, secretAccessKey, bucketName, region } = getConfig();
    const s3 = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: false,
    });

    const result = await s3.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));

    if (!result.Body) {
      res.status(404).json({ success: false, error: 'Arquivo nao encontrado' });
      return;
    }

    // Allow the frontend domain to embed images served from the API domain.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (result.ContentType) res.setHeader('Content-Type', result.ContentType);
    if (result.ContentLength !== undefined) res.setHeader('Content-Length', String(result.ContentLength));
    if (result.ETag) res.setHeader('ETag', result.ETag);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const body = result.Body;
    if (body instanceof Readable) {
      body.on('error', () => {
        if (!res.headersSent) {
          res.status(500).end();
        } else {
          res.end();
        }
      });
      body.pipe(res);
      return;
    }

    if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === 'function') {
      const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
      res.end(Buffer.from(bytes));
      return;
    }

    res.status(500).json({ success: false, error: 'Formato de arquivo nao suportado' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao carregar arquivo';
    const status = /NoSuchKey|not found|does not exist/i.test(message) ? 404 : 500;
    res.status(status).json({ success: false, error: message });
  }
};

export const makeBucketPublic = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { endpoint, accessKeyId, secretAccessKey, bucketName, region } = getConfig();

    const s3 = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: false,
    });

    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/*`
        }
      ]
    };

    await s3.send(new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy)
    }));

    res.json({ success: true, message: 'Bucket policy applied successfully! Bucket is now public.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to apply bucket policy';
    res.status(500).json({ success: false, error: message });
  }
};
