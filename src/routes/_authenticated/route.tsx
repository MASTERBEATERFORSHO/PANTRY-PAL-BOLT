import { createFileRoute, Outlet, redirect, Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Home, Apple, ChefHat, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const TABS = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/pantry", label: "Pantry", icon: Apple, exact: false },
  { to: "/recipes", label: "Recipes", icon: ChefHat, exact: false },
  { to: "/profile", label: "Profile", icon: User, exact: false },
] as const;

function AuthedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-24 max-w-md mx-auto w-full">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5 transition-transform", active && "scale-110")} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}