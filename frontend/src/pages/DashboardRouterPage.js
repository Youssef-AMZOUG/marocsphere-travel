import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardPath, getStoredUser } from '@/lib/auth';

export default function DashboardRouterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth/signin', { replace: true });
      return;
    }

    const user = getStoredUser();
    navigate(getDashboardPath(user), { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm text-stone-500">
      Redirecting to your dashboard...
    </div>
  );
}
