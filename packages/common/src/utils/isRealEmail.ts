import { resolveMx } from 'dns/promises';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function isRealEmail(email: string): Promise<boolean> {
  if (!emailRegex.test(email)) return false;

  const domain = email.split('@')[1];

  try {
    const mx = await resolveMx(domain);
    return mx.length > 0;
  } catch {
    return false;
  }
}
