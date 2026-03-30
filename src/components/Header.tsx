import { Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card bg-opacity-95 shadow-sm backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between gap-2 px-3 py-2.5 md:px-4 md:py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <div className="shrink-0 rounded-lg bg-gradient-primary p-1.5 shadow-md md:p-2">
            <Calculator className="h-5 w-5 text-primary-foreground md:h-6 md:w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate bg-gradient-primary bg-clip-text text-base font-bold text-transparent md:text-xl">
              Calculadora de Media
            </h1>
            <p className="text-[11px] leading-tight text-muted-foreground md:text-xs">
              Fatec Maua
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground xl:flex">
            <div className="rounded-md bg-muted px-2 py-1">
              <span className="font-semibold">P1:</span> 35%
            </div>
            <div className="rounded-md bg-muted px-2 py-1">
              <span className="font-semibold">P2:</span> 35%
            </div>
            <div className="rounded-md bg-muted px-2 py-1">
              <span className="font-semibold">Trab:</span> 30%
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
