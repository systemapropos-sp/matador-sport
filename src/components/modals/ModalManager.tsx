import { useModalContext } from './ModalContext';
import TicketMonitorModal from './TicketMonitorModal';
import ScheduleModal from './ScheduleModal';
import ConfigModal from './ConfigModal';
import AuthorizeModal from './AuthorizeModal';
import RandomGeneratorModal from './RandomGeneratorModal';
import PendingPaymentsModal from './PendingPaymentsModal';
import DuplicateTicketModal from './DuplicateTicketModal';
import DuplicatePlaysModal from './DuplicatePlaysModal';
import PagarModal from './PagarModal';
import ClientModal from './ClientModal';
import ClientListModal from './ClientListModal';

export default function ModalManager() {
  const { modalState, closeModal } = useModalContext();

  switch (modalState.type) {
    case 'ticketMonitor':
      return <TicketMonitorModal open={true} onClose={closeModal} />;
    case 'schedule':
      return <ScheduleModal open={true} onClose={closeModal} />;
    case 'config':
      return <ConfigModal open={true} onClose={closeModal} />;
    case 'authorize':
      return <AuthorizeModal open={true} onClose={closeModal} />;
    case 'randomGenerator':
      return <RandomGeneratorModal open={true} onClose={closeModal} />;
    case 'pendingPayments':
      return <PendingPaymentsModal open={true} onClose={closeModal} />;
    case 'duplicateTicket':
      return <DuplicateTicketModal open={true} onClose={closeModal} />;
    case 'duplicatePlays':
      return <DuplicatePlaysModal open={true} onClose={closeModal} />;
    case 'pagar':
      return <PagarModal open={true} onClose={closeModal} />;
    case 'clientCreate':
      return <ClientModal />;
    case 'clientList':
      return <ClientListModal />;
    default:
      return null;
  }
}
