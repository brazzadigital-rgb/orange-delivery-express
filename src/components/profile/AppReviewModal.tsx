import { useState } from 'react';
import { Star, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { toast } from 'sonner';
import { useReviewSettings, useSubmitReview, getStoreUrl } from '@/hooks/useAppReviews';
import { cn } from '@/lib/utils';

interface AppReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COMMENT_MAX_LENGTH = 300;

function getRatingPrompt(rating: number): string {
  if (rating <= 2) return 'O que podemos melhorar?';
  if (rating === 3) return 'Como podemos deixar melhor?';
  return 'O que você mais gostou?';
}

export function AppReviewModal({ open, onOpenChange }: AppReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [contactAllowed, setContactAllowed] = useState(false);
  const [showStorePrompt, setShowStorePrompt] = useState(false);

  const { data: settings } = useReviewSettings();
  const submitReview = useSubmitReview();

  const storeUrl = getStoreUrl(settings || null);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Por favor, selecione uma avaliação');
      return;
    }

    try {
      await submitReview.mutateAsync({
        rating,
        comment: comment.trim() || undefined,
        contactAllowed,
      });

      toast.success(settings?.thank_you_message || 'Obrigado pela avaliação! 🙌');

      // If high rating and store URL exists, show store prompt
      if (rating >= 4 && storeUrl) {
        setShowStorePrompt(true);
      } else {
        handleClose();
      }
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setContactAllowed(false);
    setShowStorePrompt(false);
    onOpenChange(false);
  };

  const handleOpenStore = () => {
    if (storeUrl) {
      window.open(storeUrl, '_blank');
    }
    handleClose();
  };

  if (showStorePrompt) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="pb-8">
          <div className="mx-auto w-full max-w-md p-4">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto">
                <Star className="w-8 h-8 text-white fill-white" />
              </div>
              
              <h3 className="text-xl font-bold">Que tal avaliar na loja?</h3>
              <p className="text-muted-foreground">
                Sua avaliação ajuda outras pessoas a conhecerem nosso app!
              </p>

              <div className="flex flex-col gap-3 pt-4">
                <Button onClick={handleOpenStore} className="btn-primary gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Avaliar na loja
                </Button>
                <Button variant="ghost" onClick={handleClose}>
                  Agora não
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8">
        <div className="mx-auto w-full max-w-md p-4">
          <DrawerHeader className="text-center px-0">
            <DrawerTitle className="text-xl">
              {settings?.review_prompt_title || 'Avaliar o app'}
            </DrawerTitle>
            <DrawerDescription>
              {settings?.review_prompt_subtitle || 'Conte como foi sua experiência'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-6 pt-4">
            {/* Star Rating */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform active:scale-90 hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'w-10 h-10 transition-colors',
                        (hoveredRating || rating) >= star
                          ? 'text-primary fill-primary'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-muted-foreground animate-fade-in">
                  {getRatingPrompt(rating)}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="comment">Comentário (opcional)</Label>
                <span className="text-xs text-muted-foreground">
                  {comment.length}/{COMMENT_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
                placeholder="Escreva aqui sua sugestão…"
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Contact Permission */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <Checkbox
                id="contact"
                checked={contactAllowed}
                onCheckedChange={(checked) => setContactAllowed(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="contact" className="text-sm font-normal cursor-pointer">
                Posso entrar em contato para entender melhor
              </Label>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || submitReview.isPending}
                className="btn-primary"
              >
                {submitReview.isPending ? 'Enviando...' : 'Enviar avaliação'}
              </Button>

              {storeUrl && (
                <Button
                  variant="outline"
                  onClick={handleOpenStore}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Avaliar na loja
                </Button>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
