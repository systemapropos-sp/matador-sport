import { useModalContext } from './ModalContext';
import MovilCrearClienteModal from './MovilCrearClienteModal';
import MovilRetiroModal from './MovilRetiroModal';
import MovilRecargasModal from './MovilRecargasModal';
import MovilCancelarRecargaModal from './MovilCancelarRecargaModal';
import MovilTicketsModal from './MovilTicketsModal';
import MovilReporteModal from './MovilReporteModal';
import MovilListaClientesModal from './MovilListaClientesModal';
import HelpModal from './HelpModal';
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
import BalanceModal from './BalanceModal';
import AccountingModal from './AccountingModal';
import VentasModal from './VentasModal';
import ReportesModal from './ReportesModal';
import CerrarCajaModal from './CerrarCajaModal';

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
      return <PendingPaymentsModal />;
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
    case 'balance':
      return <BalanceModal />;
    case 'accounting':
      return <AccountingModal />;
    case 'ventasReport':
      return <VentasModal />;
    case 'reportes':
      return <ReportesModal />;
    case 'movilCrearCliente':
      return <MovilCrearClienteModal />;
    case 'movilRetiro':
      return <MovilRetiroModal />;
    case 'movilRecargas':
      return <MovilRecargasModal />;
    case 'movilCancelarRecarga':
      return <MovilCancelarRecargaModal />;
    case 'movilTickets':
      return <MovilTicketsModal />;
    case 'movilReporte':
      return <MovilReporteModal />;
    case 'movilListaClientes':
      return <MovilListaClientesModal />;
    case 'cerrarCaja':
      return <CerrarCajaModal />;
    case 'help':
      return <HelpModal />;
    default:
      return null;
  }
}
