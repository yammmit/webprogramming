import { useState } from 'react';

function Star({ size = 20, strokeWidth = 1.5, className = '', fill = 'none', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...props}
    >
      <path d="M12 .587l3.668 7.431L23.6 9.75l-5.6 5.458L19.335 24 12 20.201 4.665 24l1.335-8.792L.4 9.75l7.932-1.732L12 .587z" />
    </svg>
  );
}

export default function StarRating({ value = 0, onChange = () => {}, editable = false }) {
  const [hover, setHover] = useState(null);

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = hover ? star <= hover : star <= value;
        const handleClick = editable ? () => onChange(star) : undefined;
        const handleMouseEnter = editable ? () => setHover(star) : undefined;
        const handleMouseLeave = editable ? () => setHover(null) : undefined;

        return (
          <Star
            key={star}
            size={18}
            strokeWidth={1.5}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: editable ? 'pointer' : 'default', transition: 'all 120ms' }}
            fill={active ? 'currentColor' : 'none'}
            className={active ? 'text-[#F16E21]' : 'text-gray-300'}
          />
        );
      })}
    </div>
  );
}
