import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t bg-card mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="text-sm text-muted-foreground text-center">
          <p className="flex items-center gap-1 justify-center">
            Feito com <Heart className="h-4 w-4 text-primary fill-primary" /> para estudantes da Fatec
          </p>
          <p className="text-xs mt-1">
            © {new Date().getFullYear()} Utilitários Fatec Mauá
          </p>
        </div>
      </div>
    </footer>
  );
}
