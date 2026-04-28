import { NextFunction, Request, Response } from 'express';

const ASSET_FIELD_NAMES = new Set([
  'avatar_url',
  'logo_url',
  'image_url',
  'receipt_url',
  'architect_avatar',
  'store_logo',
  'prize_image',
]);

const STORAGE_HOST_MARKERS = ['storageapi.dev', 'storage.railway.app'];

const encodeObjectKey = (key: string): string =>
  key.split('/').filter(Boolean).map(encodeURIComponent).join('/');

const normalizeObjectKey = (value: string): string => value.replace(/^\/+/, '');

const buildProxyUrl = (req: Pick<Request, 'protocol' | 'get'>, key: string): string =>
  `${req.protocol}://${req.get('host')}/api/upload/file/${encodeObjectKey(key)}`;

const extractObjectKey = (value: string): string | null => {
  if (!value) return null;

  if (!/^https?:\/\//i.test(value)) {
    const normalized = normalizeObjectKey(value);
    return normalized || null;
  }

  try {
    const parsed = new URL(value);
    if (!STORAGE_HOST_MARKERS.some((marker) => parsed.host.includes(marker))) {
      if (parsed.pathname.includes('/api/upload/file/')) {
        return null;
      }
      return null;
    }

    const normalized = normalizeObjectKey(decodeURIComponent(parsed.pathname));
    return normalized || null;
  } catch {
    return null;
  }
};

export const toPublicAssetUrl = (
  req: Pick<Request, 'protocol' | 'get'>,
  value: string | null | undefined
): string | null | undefined => {
  if (!value) return value;
  if (value.includes('/api/upload/file/')) return value;

  const key = extractObjectKey(value);
  if (key) return buildProxyUrl(req, key);

  return value;
};

const rewriteAssetUrls = (req: Request, input: unknown): unknown => {
  if (Array.isArray(input)) {
    return input.map((item) => rewriteAssetUrls(req, item));
  }

  if (!input || typeof input !== 'object') {
    return input;
  }

  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value === 'string' && ASSET_FIELD_NAMES.has(key)) {
      output[key] = toPublicAssetUrl(req, value) ?? value;
      continue;
    }

    output[key] = rewriteAssetUrls(req, value);
  }

  return output;
};

export const rewriteAssetUrlsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => originalJson(rewriteAssetUrls(req, body))) as typeof res.json;
  next();
};
