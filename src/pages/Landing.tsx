/**
 * AI IMAGE PROMPTS (for reference/regeneration)
 * =============================================
 * 
 * HERO (pizza premium 4K):
 * "Foto realista 4K de uma pizza gourmet recém-saída do forno a lenha, 
 * queijo derretendo e puxando fios, vapor e fumaça suave, 
 * iluminação cinematográfica dramática com tons laranja e vermelho, 
 * fundo escuro desfocado, alto contraste, textura crocante, 
 * ultra nítida, estilo fotografia de food premium, profundidade de campo curta"
 * 
 * PIZZAS DESTAQUE:
 * "Foto realista 4K de pizza pepperoni gourmet, close-up, 
 * iluminação de estúdio, fundo escuro, brilho no queijo, 
 * detalhes ultra nítidos, estilo premium"
 * 
 * "Foto realista 4K de pizza quatro queijos gourmet, close-up, 
 * iluminação cinematográfica, fundo escuro, textura e detalhes"
 * 
 * "Foto realista 4K de pizza chocolate com morango premium, close-up, 
 * iluminação quente, fundo escuro, aparência luxuosa"
 * 
 * ENTREGA:
 * "Ilustração 3D premium de motoboy moderno com caixa de pizza, 
 * estilo high-end, luz neon laranja e vermelho, fundo escuro, 
 * vibe futurista urbana, ultra detalhado"
 * 
 * APP MOCK:
 * "Mockup realista de smartphone mostrando app de delivery premium 
 * com tema laranja e preto, cards arredondados, interface moderna, 
 * iluminação de estúdio, 4K"
 */

import { useAppConfig } from '@/contexts/AppConfigContext';

// Components
import LandingHero from '@/components/landing/LandingHero';
import LandingBenefits from '@/components/landing/LandingBenefits';
import LandingMenu from '@/components/landing/LandingMenu';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingAppExperience from '@/components/landing/LandingAppExperience';
import LandingSocialProof from '@/components/landing/LandingSocialProof';
import LandingFAQ from '@/components/landing/LandingFAQ';
import LandingCTA from '@/components/landing/LandingCTA';
import LandingFooter from '@/components/landing/LandingFooter';
import FloatingCTA from '@/components/landing/FloatingCTA';

export default function Landing() {
  const { config, isLoading } = useAppConfig();
  
  const appName = config?.app_name || 'Delivery';
  const logoUrl = config?.app_logo_url;
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(230_15%_6%)] flex items-center justify-center">
        <div className="space-y-4 text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-[hsl(28_100%_50%)] border-t-transparent rounded-full mx-auto animate-spin" />
          <p className="text-[hsl(220_10%_60%)]">Carregando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[hsl(230_15%_6%)] landing-dark overflow-x-hidden">
      {/* Hero Section */}
      <LandingHero appName={appName} logoUrl={logoUrl} />
      
      {/* Benefits Section */}
      <LandingBenefits />
      
      {/* Menu Highlights */}
      <LandingMenu />
      
      {/* How It Works */}
      <LandingHowItWorks />
      
      {/* App Experience */}
      <LandingAppExperience />
      
      {/* Social Proof */}
      <LandingSocialProof />
      
      {/* FAQ */}
      <LandingFAQ />
      
      {/* CTA Section */}
      <LandingCTA />
      
      {/* Footer */}
      <LandingFooter appName={appName} logoUrl={logoUrl} />
      
      {/* Floating Install CTA */}
      <FloatingCTA />
    </div>
  );
}
