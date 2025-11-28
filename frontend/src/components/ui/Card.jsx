import { useNavigate } from "react-router-dom";

export default function Card({ children, to, onClick, bare = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) navigate(to);
    if (onClick) onClick();
  };

  const baseClass = bare
    ? "cursor-pointer rounded-xl overflow-hidden"
    : `
        bg-white 
        rounded-xl 
        p-4 
        shadow-sm 
        cursor-pointer 
        hover:shadow-md 
        transition-shadow
      `;

  return (
    <div
      onClick={handleClick}
      className={baseClass}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </div>
  );
}
