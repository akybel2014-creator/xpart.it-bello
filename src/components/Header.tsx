import {
  Bell,
  Building2,
  CheckCheck,
  FileText,
  LogOut,
  Package,
  ShoppingCart,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenSellModal: () => void;
  onNavigateSection: (sectionId: string) => void;
  onFilterVerifiedOnly: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Preventivo #PRV-412 approvato",
    detail: "Autodemolizione Padana S.r.l. ha confermato la disponibilità.",
    time: "14 min fa",
    unread: true,
  },
  {
    id: "n2",
    title: "Spedizione partita",
    detail: "Alternatore Bosch 180A in transito verso Officina Rossi.",
    time: "2 ore fa",
    unread: true,
  },
];

export function Header({
  cartCount,
  onOpenCart,
  onOpenSellModal,
  onNavigateSection,
  onFilterVerifiedOnly,
}: HeaderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
    toast.success("Tutte le notifiche sono state segnate come lette.");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#ricerca-avanzata"
          onClick={(e) => {
            e.preventDefault();
            onNavigateSection("ricerca-avanzata");
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/40 rounded-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A8A] text-white font-display text-sm font-bold tracking-tight">
            CL
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            CasaLavoro<span className="text-[#1E3A8A]">PRO</span>
          </span>
        </a>

        {/* Zone 2: Clean Single-Line Navigation */}
        <nav
          aria-label="Navigazione principale"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => onNavigateSection("ricerca-avanzata")}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-all duration-200 ease-in-out cursor-pointer"
          >
            Ricerca
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection("catalogo-ricambi")}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-all duration-200 ease-in-out cursor-pointer"
          >
            Categorie
          </button>
          <button
            type="button"
            onClick={onOpenSellModal}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-all duration-200 ease-in-out cursor-pointer"
          >
            Vendi
          </button>
          <button
            type="button"
            onClick={() => {
              onFilterVerifiedOnly();
              onNavigateSection("catalogo-ricambi");
            }}
            className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-all duration-200 ease-in-out cursor-pointer"
          >
            Demolitori Verificati
          </button>
        </nav>

        {/* Zone 3: User Area, Notifications & Cart */}
        <div className="flex items-center gap-2.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifiche B2B"
                className="relative text-slate-600 hover:text-slate-900"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#16A34A] px-1 text-[10px] font-semibold tabular-nums text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
              <div className="flex items-center justify-between px-2.5 py-2">
                <span className="text-xs font-semibold text-slate-900">
                  Aggiornamenti Ordini & Preventivi
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Segna letti
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                    )
                  }
                  className="flex-col items-start gap-1 py-2.5"
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{item.title}</span>
                    <span className="text-[11px] text-slate-400 shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.detail}</p>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCart}
            className="h-9 gap-2 border-slate-200 px-3 text-slate-800 hover:border-[#1E3A8A]/40 hover:text-[#1E3A8A]"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Carrello</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-[#1E3A8A] px-1.5 text-xs font-semibold tabular-nums text-white">
              {cartCount}
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Menu account aziendale"
                className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/40 cursor-pointer"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>OR</AvatarFallback>
                </Avatar>
                <span className="hidden lg:block text-left text-xs leading-tight pr-1">
                  <span className="block font-semibold text-slate-900">Officina Rossi</span>
                  <span className="block text-slate-500">Account B2B</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
              <DropdownMenuLabel>
                <span className="block text-sm font-semibold text-slate-900">
                  Officina Rossi S.r.l.
                </span>
                <span className="block font-mono text-[11px] font-normal text-slate-500">
                  P.IVA IT04829100964
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => toast.info("Profilo aziendale verificato (Listino Officina Attivo).")}
              >
                <Building2 className="h-4 w-4 text-slate-500" />
                Dati Aziendali & Fatturazione
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenCart}>
                <Package className="h-4 w-4 text-slate-500" />
                Ordini in Corso
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSellModal}>
                <FileText className="h-4 w-4 text-slate-500" />
                Pubblica Ricambio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => toast.info("Sessione B2B salvata in sicurezza.")}
                className="text-slate-600"
              >
                <User className="h-4 w-4 text-slate-500" />
                Gestione Operatori
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toast.info("Disconnessione simulata non attiva in anteprima.")}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Esci
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
