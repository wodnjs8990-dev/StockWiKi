import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getSiteConfig } from '@/lib/config';
import { TERMS, CATEGORIES } from '@/data/terms';
import { CALC_CATEGORIES } from '@/data/calcs';
import AdminDashboard from '@/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const auth = await isAuthenticated();
  if (!auth) {
    redirect('/admin-stk-2026/login');
  }

  const config = await getSiteConfig();

  const totalCalcs = CALC_CATEGORIES.reduce((sum, cat) => sum + cat.calcs.length, 0);
  const stats = {
    terms: TERMS.length,
    categories: CATEGORIES.length - 1, // '전체' 제외
    calcs: totalCalcs,
    calcGroups: CALC_CATEGORIES.length,
  };

  return <AdminDashboard initialConfig={config} stats={stats} />;
}
