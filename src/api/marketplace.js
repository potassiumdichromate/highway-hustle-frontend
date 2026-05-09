import { apiInterceptor } from './auth';

export async function fetchMarketplaceAssets() {
  const { data } = await apiInterceptor({ url: '/marketplace/assets?pageSize=50' });
  if (!data?.success) throw new Error(data?.error || 'Failed to fetch assets');
  return data.assets || [];
}

export async function fetchUserPurchases(walletAddress) {
  try {
    const { data } = await apiInterceptor({
      url: `/marketplace/user/${encodeURIComponent(walletAddress)}/purchases`,
    });
    return data?.purchases || [];
  } catch {
    return [];
  }
}

export async function verifyPurchase({ txHash, assetId, userIdentifier }) {
  const { data } = await apiInterceptor({
    url: '/marketplace/purchase/verify',
    method: 'POST',
    data: { txHash, assetId, userIdentifier },
  });
  if (!data?.success) throw new Error(data?.error || 'Verification failed');
  return data;
}
