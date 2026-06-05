import { motion } from 'framer-motion';
import ModalWrapper from './ModalWrapper';

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
}

const scheduleData = [
  { name: 'Anguila 10AM', closing: '9:55 AM' },
  { name: 'Anguila 1PM', closing: '12:55 PM' },
  { name: 'Anguila 6PM', closing: '5:55 PM' },
  { name: 'Anguila 9PM', closing: '8:55 PM' },
  { name: 'FLORIDA AM', closing: '1:29 PM' },
  { name: 'FLORIDA PM', closing: '9:25 PM' },
  { name: 'King Lottery AM', closing: '12:25 PM' },
  { name: 'King Lottery PM', closing: '7:20 PM' },
  { name: 'LA PRIMERA', closing: '11:55 AM' },
  { name: 'LA PRIMERA 7PM', closing: '6:55 PM' },
  { name: 'LA SUERTE', closing: '12:27 PM' },
  { name: 'LA SUERTE 6:00pm', closing: '5:57 PM' },
  { name: 'LOTEDOM', closing: '11:55 AM' },
  { name: 'LOTECA', closing: '7:55 PM' },
  { name: 'GANA MAS', closing: '2:35 PM' },
  { name: 'NACIONAL', closing: '8:55 PM' },
  { name: 'QUINIELA REAL', closing: '12:55 PM' },
  { name: 'NEW YORK AM', closing: '2:25 PM' },
  { name: 'NEW YORK PM', closing: '10:15 PM' },
  { name: 'QUINIELA PALE', closing: '8:55 PM' },
  { name: 'SUPER PALE REAL-GANA MAS', closing: '12:50 PM' },
  { name: 'SUPER PALE NACIONAL-QP', closing: '8:45 PM' },
  { name: 'SUPER PALE NY-GANA MAS', closing: '2:15 PM' },
  { name: 'SUPER PALE NY-NACIONAL', closing: '8:50 PM' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.02,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

export default function ScheduleModal({ open, onClose }: ScheduleModalProps) {
  return (
    <ModalWrapper open={open} onClose={onClose} title="Horarios" maxWidth="500px">
      <motion.div
        className="flex flex-col"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {scheduleData.map((item, index) => (
          <motion.div
            key={item.name}
            variants={itemVariants}
            className="flex items-center justify-between transition-colors"
            style={{
              padding: '10px 0',
              borderBottom: '1px dotted #e0e0e0',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9f9f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
          >
            <span style={{ fontSize: '14px', color: '#333333' }}>{item.name}</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333' }}>
              {item.closing}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer */}
      <div className="flex justify-end" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
        <button
          onClick={onClose}
          className="rounded transition-colors"
          style={{
            padding: '8px 24px',
            fontSize: '14px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #cccccc',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
        >
          Cerrar
        </button>
      </div>
    </ModalWrapper>
  );
}
