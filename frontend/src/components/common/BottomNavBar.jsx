// src/components/common/BottomNavBar.jsx
import { NavLink } from "react-router-dom";

// Replace lucide-react dependency with small local SVG icon components
const Home = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 10.5L12 4l9 6.5" />
    <path d="M9 21V13h6v8" />
    <path d="M21 21H3" />
  </svg>
);

const CheckSquare = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const Settings = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 1 1 2.28 17.8l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82L4.2 5.28A2 2 0 1 1 7 2.45l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c.05.57.39 1.08 1 1.51h.12a1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 21.72 6.2l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.57.05 1.08.39 1.51 1H21a2 2 0 0 1 0 4h-.09c-.57.05-1.08.39-1.51 1z" />
  </svg>
);

export default function BottomNavBar() {
  // resolve current groupId from localStorage (fallback to '10')
  const resolvedGroupId = (() => {
    if (typeof window === "undefined") return "10";
    try {
      const gid =
        localStorage.getItem("group_id") ||
        localStorage.getItem("currentGroupId");
      if (gid) return gid;
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        // try common shapes
        if (parsed?.group_id) return String(parsed.group_id);
        if (parsed?.groupId) return String(parsed.groupId);
        if (
          Array.isArray(parsed?.groups) &&
          parsed.groups.length > 0
        )
          return String(
            parsed.groups[0].group_id || parsed.groups[0].groupId
          );
      }
    } catch (e) {
      // ignore
    }
    return "10";
  })();

  const menus = [
    {
      name: "홈",
      to: "/main/dashboard",
      icon: (isActive) => (
        <Home
          className={isActive ? "text-[#F16E21]" : "text-gray-500"}
          fill={isActive ? "currentColor" : "none"}
        />
      ),
    },
    {
      name: "가사분담",
      to: `/main/chores/${resolvedGroupId}`,
      icon: (isActive) => (
        <CheckSquare
          className={isActive ? "text-[#F16E21]" : "text-gray-500"}
          fill={isActive ? "currentColor" : "none"}
        />
      ),
    },
    {
      name: "설정",
      to: "/settings",
      icon: (isActive) => (
        <Settings
          className={isActive ? "text-[#F16E21]" : "text-gray-500"}
          fill={isActive ? "currentColor" : "none"}
        />
      ),
    },
  ];

  return (
    <nav
      className="
        w-full 
        bg-white 
        border-t 
        border-gray-200
        shadow-[0_-2px_6px_rgba(0,0,0,0.08)]
      "
    >
      <ul className="flex justify-around py-2">
        {menus.map((menu) => {
          return (
            <li key={menu.name}>
              <NavLink
                to={menu.to}
                className={({ isActive }) =>
                  `
                  flex flex-col items-center gap-1 px-4 py-1
                  text-xs font-medium
                  transition-colors
                  ${
                    isActive
                      ? "text-[#F16E21]"
                      : "text-gray-500 hover:text-gray-700"
                  }
                `
                }
              >
                {({ isActive }) => (
                  <>
                    {menu.icon(isActive)}
                    <span className="mt-1 text-xs">{menu.name}</span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
