import { motion } from 'framer-motion';

interface IconButtonProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  onClick?: () => void;
  title?: string;
  active?: boolean;
}

export default function IconButton({ icon: Icon, onClick, title, active = false }: IconButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center justify-center rounded transition-colors"
      style={{
        width: '38px',
        height: '38px',
        border: active ? '2px solid rgba(255,255,255,0.5)' : '1px solid rgba(0,0,0,0.15)',
        borderRadius: '6px',
        backgroundColor: active ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
        color: '#ffffff',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.25)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = active ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)'; }}
      title={title}
    >
      <Icon size={17} />
    </motion.button>
  );
}
