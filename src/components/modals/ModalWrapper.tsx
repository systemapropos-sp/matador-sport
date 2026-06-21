import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface ModalWrapperProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const contentVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export default function ModalWrapper({
  open,
  onClose,
  title,
  children,
  maxWidth = '600px',
  showCloseButton = true,
}: ModalWrapperProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[1000]"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[1001] flex items-center justify-center pointer-events-none"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div
                  className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col pointer-events-auto"
                  style={{
                    maxWidth,
                    width: 'calc(100% - 2rem)',
                    maxHeight: '95vh',
                  }}
                >
                {/* Header */}
                <div
                  className="flex items-center justify-between shrink-0"
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #e0e0e0',
                  }}
                >
                  <DialogPrimitive.Title
                    style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#333333',
                      margin: 0,
                    }}
                  >
                    {title}
                  </DialogPrimitive.Title>
                  {showCloseButton && (
                    <DialogPrimitive.Close asChild>
                      <button
                        onClick={onClose}
                        className="flex items-center justify-center rounded transition-colors"
                        style={{
                          width: '32px',
                          height: '32px',
                          background: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        aria-label="Close"
                      >
                        <X size={18} color="#777777" />
                      </button>
                    </DialogPrimitive.Close>
                  )}
                </div>

                  {/* Body */}
                  <div
                    className="overflow-y-auto modal-scrollbar flex-1 min-h-0"
                    style={{ padding: '16px 20px' }}
                  >
                    {children}
                  </div>
                </div>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
