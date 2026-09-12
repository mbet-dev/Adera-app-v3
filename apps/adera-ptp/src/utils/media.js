const isAbsoluteUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

const getPublicStorageBaseUrl = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/`;
};

const STORAGE_BASE_URL = getPublicStorageBaseUrl();

/**
 * Resolves partner media paths (storefront images, logos) into fully-qualified URLs
 * while gracefully handling already absolute URLs and optional storage buckets.
 * @param {string|null} value - Stored value coming from Supabase (can be relative or absolute)
 * @returns {string|null}
 */
export const getPartnerMediaUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (isAbsoluteUrl(value)) return value;

  const sanitizedPath = value.replace(/^\/+/, '');
  if (!STORAGE_BASE_URL) return sanitizedPath;
  return `${STORAGE_BASE_URL}${sanitizedPath}`;
};

/**
 * Returns the best hero image for a partner, preferring storefront imagery
 * over logos but falling back gracefully. Accepts either a single string
 * or an object with storefront/logo keys.
 */
export const getPartnerHeroImage = ({ storefrontImage, logoUrl }) => {
  return storefrontImage || logoUrl || null;
};
