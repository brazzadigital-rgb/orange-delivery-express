import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * QR Code entry point: /t/:qrToken
 * Validates table → finds/creates session → generates token → redirects to /s/:sessionToken/menu
 */
export default function TableQREntry() {
  const { token: qrToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!qrToken) return;
    handleEntry();
  }, [qrToken]);

  const handleEntry = async () => {
    try {
      // 1. Validate table
      const { data: table, error: tableErr } = await supabase
        .from('restaurant_tables')
        .select('id, store_id, is_active, number')
        .eq('qr_token', qrToken!)
        .maybeSingle();

      if (tableErr) throw tableErr;
      if (!table || !table.is_active) {
        setError('Mesa indisponível ou QR Code inválido.');
        setLoading(false);
        return;
      }

      // 2. Find or create open session
      let { data: session } = await supabase
        .from('table_sessions')
        .select('id')
        .eq('table_id', table.id)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session) {
        const { data: newSession, error: sessErr } = await supabase
          .from('table_sessions')
          .insert({ table_id: table.id, store_id: table.store_id })
          .select('id')
          .single();
        if (sessErr) throw sessErr;
        session = newSession;
      }

      // 3. Get token expiration setting
      const { data: settings } = await supabase
        .from('store_settings')
        .select('token_expiration_minutes')
        .limit(1)
        .maybeSingle();

      const expMinutes = (settings as any)?.token_expiration_minutes ?? 60;
      const expiresAt = expMinutes > 0
        ? new Date(Date.now() + expMinutes * 60 * 1000).toISOString()
        : null;

      // 4. Generate new session token
      const { data: tokenData, error: tokenErr } = await supabase
        .from('table_session_tokens' as any)
        .insert({
          table_session_id: session!.id,
          status: 'active',
          expires_at: expiresAt,
        })
        .select('token')
        .single();

      if (tokenErr) throw tokenErr;

      // 5. Redirect to session menu
      navigate(`/s/${(tokenData as any).token}/menu`, { replace: true });
    } catch (err: any) {
      console.error('QR Entry error:', err);
      setError('Erro ao abrir mesa. Tente novamente.');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-destructive" />
          <h1 className="text-xl font-bold mb-2">Erro</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Abrindo sua mesa...</p>
      </div>
    </div>
  );
}
