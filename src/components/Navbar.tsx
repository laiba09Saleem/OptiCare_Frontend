import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Activity, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/patients", label: "Patients" },
  { to: "/reports", label: "Reports" },
];

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "DR";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/dashboard" className="group flex items-center gap-3 font-bold transition-all hover:opacity-90">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110" style={{ background: "var(--gradient-brand)" }}>
            <Activity className="h-6 w-6 text-white" />
          </span>
          <span className="text-xl tracking-tight">Opti<span className="text-brand">Care</span></span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "relative px-4 py-2 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "text-brand"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-brand" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Profile Avatar Button */}
          <Link
            to="/profile"
            title="My Profile"
            className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all ring-2 ring-background"
          >
            {initials}
          </Link>

          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-bold">{user?.name}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Healthcare Provider</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;