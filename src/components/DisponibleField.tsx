import { usePlayLimit } from '@/hooks/usePlayLimit';

interface DisponibleFieldProps {
  jugada: string;
  lotteryId: string;
}

export default function DisponibleField({ jugada, lotteryId }: DisponibleFieldProps) {
  const businessId = localStorage.getItem('nmv_business_id') || null;
  const active = jugada.length >= 2 && !!lotteryId;
  const { disponible, limite, loading } = usePlayLimit(
    active ? jugada : '',
    active ? lotteryId : '',
    active ? businessId : null
  );

  const hasLimit = active && !loading && limite !== null;
  const color = !hasLimit ? '#aaaaaa'
    : disponible === 0 ? '#d32f2f'
    : disponible !== null && disponible <= 5 ? '#f57c00'
    : '#388e3c';

  return (
    <div className="flex flex-col gap-1 flex-shrink-0" style={{ minWidth: '90px' }}>
      <label className="uppercase font-bold" style={{ fontSize: '11px', color: '#555', letterSpacing: '0.5px' }}>
        DISPONIBLE
      </label>
      <div
        className="flex items-center justify-center rounded border font-bold"
        style={{
          padding: '14px 10px',
          fontSize: '18px',
          color: hasLimit ? color : '#aaaaaa',
          borderColor: hasLimit ? color : '#cccccc',
          backgroundColor: hasLimit ? `${color}11` : '#f9f9f9',
          minHeight: '55px',
          minWidth: '90px',
        }}
      >
        {!active ? '—' : loading ? '…' : limite === null ? '∞' : (
          <>
            {disponible ?? 0}
            <span style={{ fontSize: '10px', color: '#888', marginLeft: 3 }}>/{limite}</span>
          </>
        )}
      </div>
    </div>
  );
}
