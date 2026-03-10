import { format } from 'date-fns';
import { PrintStyles } from '@/components/print/PrintStyles';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TestPrint() {
  const navigate = useNavigate();
  const { data: settings } = usePrintSettings();
  const paperSize = settings?.paper_size || '80mm';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Toolbar - hidden when printing */}
      <div className="no-print bg-background border-b p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold">Teste de Impressão</h1>
            <p className="text-sm text-muted-foreground">
              Verifique o layout na sua impressora térmica
            </p>
          </div>
       </div>
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
      </div>

      {/* Print Content */}
      <div className="py-8">
        <PrintStyles paperSize={paperSize} />
        <div className="print-container">
          <div className="print-header">
            <div className="print-bold print-large">🍕 TESTE DE IMPRESSÃO</div>
            <div className="print-small">Papel: {paperSize}</div>
          </div>

          <div className="print-section">
            <div className="print-row">
              <span className="print-bold">Pedido:</span>
              <span className="print-large print-bold">#999</span>
            </div>
            <div className="print-row">
              <span>Data:</span>
              <span>{format(new Date(), "dd/MM/yyyy HH:mm")}</span>
            </div>
          </div>

          <hr className="print-cut" />

          <div className="print-section">
            <div className="print-bold">ITENS:</div>
            <div className="print-item">
              <div className="print-row">
                <span>1x Pizza Margherita GG</span>
                <span>R$ 59,90</span>
              </div>
              <div className="print-small" style={{ marginLeft: '8px' }}>
                • Borda: Catupiry<br />
                • Extra: Bacon
              </div>
            </div>
            <div className="print-item">
              <div className="print-row">
                <span>2x Coca-Cola 2L</span>
                <span>R$ 24,00</span>
              </div>
            </div>
          </div>

          <hr className="print-cut" />

          <div className="print-section">
            <div className="print-row">
              <span>Subtotal:</span>
              <span>R$ 83,90</span>
            </div>
            <div className="print-row">
              <span>Taxa de entrega:</span>
              <span>R$ 8,00</span>
            </div>
            <div className="print-row print-bold print-large">
              <span>TOTAL:</span>
              <span>R$ 91,90</span>
            </div>
          </div>

          <div className="print-highlight">
            <div className="print-bold">💵 TROCO</div>
            <div className="print-row">
              <span>Troco para:</span>
              <span>R$ 100,00</span>
            </div>
            <div className="print-row print-bold">
              <span>Troco:</span>
              <span>R$ 8,10</span>
            </div>
          </div>

          <hr className="print-cut" />

          <div className="print-highlight">
            <div className="print-bold">📍 ENDEREÇO:</div>
            <div>Rua das Pizzas, 123</div>
            <div>Apto 45 - Bloco B</div>
            <div>Centro - São Paulo</div>
          </div>

          <hr className="print-cut" />

          <div className="print-obs">
            <div className="print-bold">⚠️ OBSERVAÇÃO:</div>
            <div>Sem cebola, por favor. Interfone não funciona, ligar no celular.</div>
          </div>

          <hr className="print-cut" />

          <div className="print-center">
            {settings?.footer_message && (
              <div className="print-small">{settings.footer_message}</div>
            )}
            <div className="print-small" style={{ marginTop: '4px' }}>
              ✓ Teste concluído com sucesso!
            </div>
            <div className="print-small">
              {format(new Date(), "dd/MM/yyyy HH:mm:ss")}
           </div>
         </div>
       </div>
     </div>
    </div>
  );
}