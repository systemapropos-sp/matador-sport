import React from "react";
import { useModal } from "./ModalContext";
import TicketMonitorModal from "./TicketMonitorModal";
import ScheduleModal from "./ScheduleModal";
import ConfigModal from "./ConfigModal";
import AuthorizeModal from "./AuthorizeModal";
import RandomGeneratorModal from "./RandomGeneratorModal";
import PendingPaymentsModal from "./PendingPaymentsModal";
import DuplicateTicketModal from "./DuplicateTicketModal";
import DuplicatePlaysModal from "./DuplicatePlaysModal";
import PagarModal from "./PagarModal";

export default function ModalManager() {
  const { modalState } = useModal();

  if (!modalState.type) return null;

  switch (modalState.type) {
    case "ticketMonitor":
      return <TicketMonitorModal />;
    case "schedule":
      return <ScheduleModal />;
    case "config":
      return <ConfigModal />;
    case "authorize":
      return <AuthorizeModal />;
    case "randomGenerator":
      return <RandomGeneratorModal />;
    case "pendingPayments":
      return <PendingPaymentsModal />;
    case "duplicateTicket":
      return <DuplicateTicketModal />;
    case "duplicatePlays":
      return <DuplicatePlaysModal />;
    case "pagar":
      return <PagarModal />;
    default:
      return null;
  }
}
