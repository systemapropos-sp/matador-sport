import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, X, MessageCircle } from 'lucide-react';
import { generateTicketImage } from '@/components/TicketImageGenerator';
import ModalWrapper from './ModalWrapper';

interface TicketShareModalProps {
  ticketNumber: string;
  plays: any[];
  total: number;
  clientName?: string;
  clientPhone?: string;
  vendorName?: string;
  onClose: () => void;
}

export default function TicketShareModal({ ticketNumber, plays, total, clientName, clientPhone, vendorName, onClose }: TicketShareModalProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const hash = Array.from({ length: 32 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('');

    const data = {
      ticketNumber,
      postName: 'POST MMW 25',
      date: dateStr,
      time: timeStr,
      hash,
      plays: plays.map((p: any) => ({
        lotteryName: p.lotteryName,
        numbers: p.numbers,
        amount: p.amount,
        type: p.type,
      })),
      total,
      vendorName: vendorName || 'Vendedor',
    };

    try {
      const url = generateTicketImage(data);
      setImageUrl(url);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [ticketNumber, plays, total, vendorName]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ticket-${ticketNumber}.png`;
    link.click();
  };

  const handleWhatsApp = () => {
    if (!clientPhone) return;
    const msg = `Hola ${clientName || ''}, aqui esta tu ticket ${ticketNumber} de MATADOR-SPORT. Total: $${total.toFixed(2)}`;
    const cleanPhone = clientPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <ModalWrapper open={true} onClose={onClose} title="Ticket Generado" maxWidth="500px">
      <div className="flex flex-col items-center gap-4">
        {loading ? (
          <div className="py-8 text-gray-400 text-sm">Generando ticket...</div>
        ) : imageUrl ? (
          <>
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={imageUrl}
              alt="Ticket POS"
              className="max-w-full rounded shadow-md"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
            <div className="flex gap-2 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white"
                style={{ backgroundColor: '#337ab7' }}
              >
                <Download size={16} /> Descargar
              </motion.button>
              {clientPhone && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle size={16} /> WhatsApp
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold border-2 border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <X size={16} /> Cerrar
              </motion.button>
            </div>
          </>
        ) : (
          <div className="py-8 text-red-500 text-sm">Error al generar ticket</div>
        )}
      </div>
    </ModalWrapper>
  );
}
