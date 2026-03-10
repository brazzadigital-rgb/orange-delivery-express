import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Qual o tempo de entrega?',
    answer: 'Nossas entregas são feitas em 30 a 40 minutos. Você pode acompanhar em tempo real pelo app.',
  },
  {
    question: 'Como funciona o rastreio?',
    answer: 'Após seu pedido sair, você vê a localização do motoboy no mapa, atualizado em tempo real.',
  },
  {
    question: 'Posso agendar meu pedido?',
    answer: 'Sim! No checkout você pode escolher data e horário de entrega de até 7 dias.',
  },
  {
    question: 'Formas de pagamento?',
    answer: 'Aceitamos Pix, cartões de crédito/débito e pagamento na entrega.',
  },
];

export default function LandingFAQ() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );

    const items = sectionRef.current?.querySelectorAll('.reveal-on-scroll');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-20 lg:py-32 bg-[hsl(230_15%_6%)]">
      <div className="container mx-auto px-4 sm:px-6 max-w-2xl lg:max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16 reveal-on-scroll">
          <span className="badge-premium inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            Dúvidas Frequentes
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[hsl(30_100%_96%)] mb-3 sm:mb-4">
            Perguntas{' '}
            <span className="bg-gradient-to-r from-[hsl(28_100%_55%)] to-[hsl(345_100%_60%)] bg-clip-text text-transparent">
              & Respostas
            </span>
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="reveal-on-scroll faq-item overflow-hidden"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
              >
                <span className="text-sm sm:text-base lg:text-lg font-semibold text-[hsl(30_100%_96%)] pr-4">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-[hsl(28_100%_55%)] transition-transform duration-300 flex-shrink-0 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? 'max-h-32 sm:max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-[hsl(220_10%_60%)] leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
