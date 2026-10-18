import React from 'react';

export type TileTone = 'red' | 'orange' | 'purple' | 'green' | 'pink' | 'blue' | 'teal' | 'indigo' | 'slate';

const TONES: Record<TileTone, { tint: string; grad: [string, string] }> = {
  red: { tint: '#FFEFF1', grad: ['#FF7A7A', '#E8456B'] },
  orange: { tint: '#FFF4DF', grad: ['#FFC15A', '#F28C28'] },
  purple: { tint: '#F1EBFF', grad: ['#B993FF', '#7B5BE6'] },
  green: { tint: '#E6F8EF', grad: ['#55E0A5', '#1FB77C'] },
  pink: { tint: '#FFEAF1', grad: ['#FF9DB3', '#F2587E'] },
  blue: { tint: '#E6F2FF', grad: ['#7CC4FF', '#2F80ED'] },
  teal: { tint: '#E2F7F6', grad: ['#4FD8D0', '#14A6A0'] },
  indigo: { tint: '#E9ECFF', grad: ['#8FA2FF', '#4B5BE0'] },
  slate: { tint: '#EDF1F7', grad: ['#9FB0C8', '#5E7391'] },
};

/** Big rounded shortcut tile: glossy gradient icon circle with a centred label. */
export const HomeTile: React.FC<{
  label: string;
  icon: React.ReactNode;
  tone: TileTone;
  onClick: () => void;
  badge?: React.ReactNode;
}> = ({ label, icon, tone, onClick, badge }) => {
  const c = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: `linear-gradient(135deg, ${c.tint}, #FFFFFF 85%)` }}
      className="school-card relative min-h-[96px] rounded-3xl border border-[#E4E8F0] flex flex-col items-center justify-center gap-2 px-2 py-3 text-center text-[#14284B] active:scale-95 transition-transform cursor-pointer"
    >
      <span
        className="ps-keep w-12 h-12 rounded-full flex items-center justify-center text-white"
        style={{
          background: `radial-gradient(circle at 30% 22%, rgba(255,255,255,0.55), rgba(255,255,255,0) 46%), linear-gradient(145deg, ${c.grad[0]}, ${c.grad[1]})`,
          boxShadow: `0 6px 14px ${c.grad[1]}55`,
        }}
      >
        {icon}
      </span>
      <span className="text-[13px] font-bold max-w-full leading-tight">{label}</span>
      {badge}
    </button>
  );
};
