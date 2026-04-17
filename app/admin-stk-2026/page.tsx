import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminRoot() {
  const auth = await isAuthenticated();
  if (auth) {
    redirect('/admin-stk-2026/dashboard');
  } else {
    redirect('/admin-stk-2026/login');
  }
}
