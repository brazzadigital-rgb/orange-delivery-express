import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { clearClientState } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function Logout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const performLogout = async () => {
      // Clear ALL cached state before signing out
      queryClient.clear();
      clearClientState();
      
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) console.error('Error signing out:', error);
      navigate('/auth/login', { replace: true });
    };
    
    performLogout();
  }, [navigate, queryClient]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-muted-foreground">Saindo...</p>
    </div>
  );
}
