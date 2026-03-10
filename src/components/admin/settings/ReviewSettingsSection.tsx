import { useEffect, useState } from 'react';
import { Star, ExternalLink, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminReviewSettings, useUpdateReviewSettings } from '@/hooks/useAdminReviews';

export function ReviewSettingsSection() {
  const { data: settings, isLoading } = useAdminReviewSettings();
  const updateSettings = useUpdateReviewSettings();

  const [enabled, setEnabled] = useState(true);
  const [minDays, setMinDays] = useState(30);
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [appStoreUrl, setAppStoreUrl] = useState('');
  const [promptTitle, setPromptTitle] = useState('Avaliar o app');
  const [promptSubtitle, setPromptSubtitle] = useState('Conte como foi sua experiência');
  const [thankYouMessage, setThankYouMessage] = useState('Obrigado pela avaliação! 🙌');

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setMinDays(settings.min_days_between_reviews);
      setPlayStoreUrl(settings.play_store_url || '');
      setAppStoreUrl(settings.app_store_url || '');
      setPromptTitle(settings.review_prompt_title || 'Avaliar o app');
      setPromptSubtitle(settings.review_prompt_subtitle || 'Conte como foi sua experiência');
      setThankYouMessage(settings.thank_you_message || 'Obrigado pela avaliação! 🙌');
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      enabled,
      min_days_between_reviews: minDays,
      play_store_url: playStoreUrl || null,
      app_store_url: appStoreUrl || null,
      review_prompt_title: promptTitle,
      review_prompt_subtitle: promptSubtitle,
      thank_you_message: thankYouMessage,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4" />
            Avaliação do App
          </CardTitle>
          <CardDescription>
            Permite que clientes avaliem a experiência no aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ativar avaliações</Label>
              <p className="text-sm text-muted-foreground">
                Mostra opção de avaliar no perfil do cliente
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Intervalo mínimo entre avaliações
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={365}
                value={minDays}
                onChange={(e) => setMinDays(parseInt(e.target.value) || 30)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">dias</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Usuários só podem enviar nova avaliação após este período
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Store Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Links das Lojas
          </CardTitle>
          <CardDescription>
            Configure links para avaliação nas lojas de aplicativos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Google Play Store URL</Label>
            <Input
              type="url"
              placeholder="https://play.google.com/store/apps/details?id=..."
              value={playStoreUrl}
              onChange={(e) => setPlayStoreUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Apple App Store URL</Label>
            <Input
              type="url"
              placeholder="https://apps.apple.com/app/..."
              value={appStoreUrl}
              onChange={(e) => setAppStoreUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Texts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Textos Personalizados</CardTitle>
          <CardDescription>
            Personalize as mensagens exibidas no modal de avaliação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título do modal</Label>
            <Input
              value={promptTitle}
              onChange={(e) => setPromptTitle(e.target.value)}
              placeholder="Avaliar o app"
            />
          </div>

          <div className="space-y-2">
            <Label>Subtítulo do modal</Label>
            <Input
              value={promptSubtitle}
              onChange={(e) => setPromptSubtitle(e.target.value)}
              placeholder="Conte como foi sua experiência"
            />
          </div>

          <div className="space-y-2">
            <Label>Mensagem de agradecimento</Label>
            <Input
              value={thankYouMessage}
              onChange={(e) => setThankYouMessage(e.target.value)}
              placeholder="Obrigado pela avaliação! 🙌"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={updateSettings.isPending}
        className="w-full btn-primary"
      >
        {updateSettings.isPending ? 'Salvando...' : 'Salvar configurações'}
      </Button>
    </div>
  );
}
