import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardNav from '@/components/dashboard/DashboardNav';

export default async function TreeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <DashboardNav user={user} fullWidth={true} />
      <main className="flex-1 relative w-full">
        {children}
      </main>
    </div>
  );
}

