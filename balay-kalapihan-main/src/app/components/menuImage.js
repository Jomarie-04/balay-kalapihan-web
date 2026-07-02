export function getMenuImageFallback(name, currentImageUrl = '') {
  const normalizedName = `${name || ''} ${currentImageUrl || ''}`.toLowerCase();

  if (normalizedName.includes('matcha') || normalizedName.includes('milktea')) {
    return '/images/matcha-krema.avif';
  }

  return '/images/kipin-logo.png';
}

export function getMenuImageSrc(name, imageUrl) {
  if (typeof imageUrl === 'string' && imageUrl.trim()) {
    return imageUrl;
  }

  return getMenuImageFallback(name, imageUrl);
}
