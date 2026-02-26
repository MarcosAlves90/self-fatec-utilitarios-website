import { Link, NavLink, useLocation } from "react-router-dom";
import { Calculator, Newspaper } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

export function Header() {
  const location = useLocation();
  const isNewsPage = location.pathname.startsWith("/noticias");

  const navClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      "px-2.5 py-1 rounded-md text-xs md:text-sm transition-colors",
      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent",
    );

  return (
    <header className="w-full border-b bg-card shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="container mx-auto px-3 md:px-4 py-2.5 md:py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 md:p-2 bg-gradient-primary rounded-lg shadow-md shrink-0">
            {isNewsPage ? (
              <Newspaper className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
            ) : (
              <Calculator className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
              {isNewsPage ? "Notícias Fatec Mauá" : "Calculadora de Média"}
            </h1>
            <p className="text-[11px] md:text-xs text-muted-foreground leading-tight">
              Fatec Mauá
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5">
            <NavLink to="/" className={navClassName} end>
              Calculadora
            </NavLink>
            <NavLink to="/noticias" className={navClassName}>
              Notícias
            </NavLink>
          </div>

          {!isNewsPage ? (
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="px-2 py-1 bg-muted rounded-md">
                <span className="font-semibold">P1:</span> 35%
              </div>
              <div className="px-2 py-1 bg-muted rounded-md">
                <span className="font-semibold">P2:</span> 35%
              </div>
              <div className="px-2 py-1 bg-muted rounded-md">
                <span className="font-semibold">Trab:</span> 30%
              </div>
            </div>
          ) : null}

          <div className="md:hidden">
            <NavLink to={isNewsPage ? "/" : "/noticias"} className={navClassName}>
              {isNewsPage ? "Calc" : "News"}
            </NavLink>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
