import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ModalWrapper from './ModalWrapper';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
}

interface ConfigState {
  imprimir: boolean;
  soloSms: boolean;
  modoImpresion: 'driver' | 'generic';
  idioma: 'english' | 'spanish';
}

const defaultConfig: ConfigState = {
  imprimir: false,
  soloSms: false,
  modoImpresion: 'generic',
  idioma: 'spanish',
};

function loadConfig(): ConfigState {
  try {
    const stored = localStorage.getItem('matador_config');
    if (stored) return JSON.parse(stored) as ConfigState;
  } catch { /* ignore */ }
  return defaultConfig;
}

export default function ConfigModal({ open, onClose }: ConfigModalProps) {
  const [config, setConfig] = useState<ConfigState>(loadConfig);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setConfig(loadConfig());
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem('matador_config', JSON.stringify(config));
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 500);
  };

  const handleCancel = () => {
    setConfig(loadConfig());
    onClose();
  };

  return (
    <ModalWrapper open={open} onClose={handleCancel} title="Configuraciones de la banca" maxWidth="400px">
      <div className="flex flex-col gap-6">
        {/* Toggle: Imprimir */}
        <div className="flex items-center justify-between">
          <label style={{ fontSize: '14px', color: '#333333' }}>Imprimir</label>
          <Switch
            checked={config.imprimir}
            onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, imprimir: checked }))}
          />
        </div>

        {/* Toggle: Solo SMS */}
        <div className="flex items-center justify-between">
          <label style={{ fontSize: '14px', color: '#333333' }}>Solo SMS</label>
          <Switch
            checked={config.soloSms}
            onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, soloSms: checked }))}
          />
        </div>

        {/* Radio: Modo de impresion */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#555555', display: 'block', marginBottom: '12px' }}>
            Modo de impresion
          </label>
          <RadioGroup
            value={config.modoImpresion}
            onValueChange={(val) => setConfig((prev) => ({ ...prev, modoImpresion: val as 'driver' | 'generic' }))}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="driver" id="driver" />
              <label htmlFor="driver" style={{ fontSize: '14px', color: '#333333', marginLeft: '8px', cursor: 'pointer' }}>
                Driver
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="generic" id="generic" />
              <label htmlFor="generic" style={{ fontSize: '14px', color: '#333333', marginLeft: '8px', cursor: 'pointer' }}>
                Generic
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Radio: Idioma */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#555555', display: 'block', marginBottom: '12px' }}>
            Idioma
          </label>
          <RadioGroup
            value={config.idioma}
            onValueChange={(val) => setConfig((prev) => ({ ...prev, idioma: val as 'english' | 'spanish' }))}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="english" id="english" />
              <label htmlFor="english" style={{ fontSize: '14px', color: '#333333', marginLeft: '8px', cursor: 'pointer' }}>
                English
              </label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="spanish" id="spanish" />
              <label htmlFor="spanish" style={{ fontSize: '14px', color: '#333333', marginLeft: '8px', cursor: 'pointer' }}>
                Spanish
              </label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex justify-end gap-2"
        style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}
      >
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleCancel}
          className="rounded transition-colors"
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #cccccc',
            color: '#555555',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e0e0e0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
        >
          Cancel
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="rounded transition-colors"
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            backgroundColor: showSuccess ? '#5cb85c' : '#337ab7',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => { if (!showSuccess) e.currentTarget.style.backgroundColor = '#286090'; }}
          onMouseLeave={(e) => { if (!showSuccess) e.currentTarget.style.backgroundColor = '#337ab7'; }}
        >
          {showSuccess ? 'Guardado!' : 'Guardar cambios'}
        </motion.button>
      </div>
    </ModalWrapper>
  );
}
