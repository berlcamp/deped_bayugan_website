"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useTheme } from "next-themes";
import {
  ClipboardCheck,
  ExternalLink,
  FileText,
  Files,
  FolderTree,
  Home,
  LayoutDashboard,
  LayoutGrid,
  ListTree,
  LogOut,
  Menu,
  Monitor,
  Moon,
  PenSquare,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { signOut } from "@/app/(admin)/admin/actions";
import { BrandMark } from "@/components/admin/brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Me = { name: string; email: string; avatar: string | null; role: "admin" | "editor" };

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: number; match: (p: string, s: URLSearchParams) => boolean };

function navFor(role: Me["role"], pending: number): { title?: string; items: NavItem[] }[] {
  const content: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, match: (p) => p === "/admin" },
    {
      href: "/admin/articles",
      label: role === "admin" ? "All posts" : "My posts",
      icon: FileText,
      match: (p, s) => p.startsWith("/admin/articles") && p !== "/admin/articles/new" && s.get("status") !== "pending",
    },
  ];
  if (role === "admin") {
    content.push({
      href: "/admin/articles?status=pending",
      label: "Review queue",
      icon: ClipboardCheck,
      badge: pending,
      match: (p, s) => p === "/admin/articles" && s.get("status") === "pending",
    });
  }
  const groups: { title?: string; items: NavItem[] }[] = [{ items: content }];
  if (role === "admin") {
    groups.push({
      title: "Website",
      items: [
        { href: "/admin/homepage", label: "Homepage", icon: Home, match: (p) => p.startsWith("/admin/homepage") },
        { href: "/admin/pages", label: "Pages", icon: Files, match: (p) => p.startsWith("/admin/pages") },
        { href: "/admin/menu", label: "Menu", icon: ListTree, match: (p) => p.startsWith("/admin/menu") },
        { href: "/admin/services", label: "Online services", icon: LayoutGrid, match: (p) => p.startsWith("/admin/services") },
        { href: "/admin/categories", label: "Sections", icon: FolderTree, match: (p) => p.startsWith("/admin/categories") },
      ],
    });
    groups.push({
      title: "Manage",
      items: [
        { href: "/admin/users", label: "Team", icon: Users, match: (p) => p.startsWith("/admin/users") },
        { href: "/admin/settings", label: "Settings", icon: Settings, match: (p) => p.startsWith("/admin/settings") },
      ],
    });
  }
  return groups;
}

function NavLinks({ groups, onNavigate }: { groups: ReturnType<typeof navFor>; onNavigate?: () => void }) {
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <nav aria-label="Admin" className="space-y-6">
      {groups.map((g, i) => (
        <div key={i}>
          {g.title && <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>}
          <ul className="space-y-1">
            {g.items.map((item) => {
              const active = item.match(pathname, search);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-muted hover:text-foreground",
                      active && "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="size-[18px]" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {!!item.badge && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground" aria-label={`${item.badge} waiting`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserMenu({ me }: { me: Me }) {
  const { theme, setTheme } = useTheme();
  const [pending, start] = useTransition();
  const initials = me.name
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted" aria-label="Account menu" />
        }
      >
        <Avatar className="size-9">
          {me.avatar && <AvatarImage src={me.avatar} alt="" referrerPolicy="no-referrer" />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{me.name}</span>
          <span className="block text-xs capitalize text-muted-foreground">{me.role}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{me.email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={(v) => setTheme(String(v))}>
            <DropdownMenuRadioItem value="light">
              <Sun /> Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon /> Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor /> System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={pending} onClick={() => start(() => signOut())}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarBody({ me, groups, onNavigate }: { me: Me; groups: ReturnType<typeof navFor>; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-1">
        <BrandMark />
        <p className="mt-1 pl-[42px] text-xs font-medium text-muted-foreground">Website admin</p>
      </div>
      <Link href="/admin/articles/new" onClick={onNavigate} className={cn(buttonVariants(), "h-11 gap-2 rounded-xl text-sm font-semibold")}>
        <PenSquare className="size-4" /> New post
      </Link>
      <div className="flex-1 overflow-y-auto">
        <NavLinks groups={groups} onNavigate={onNavigate} />
      </div>
      <div className="space-y-1 border-t pt-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-sidebar-foreground hover:bg-muted"
        >
          <ExternalLink className="size-[18px]" aria-hidden="true" /> View site
        </a>
        <UserMenu me={me} />
      </div>
    </div>
  );
}

export function AdminChrome({ staff, pendingCount, children }: { staff: Me; pendingCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const groups = navFor(staff.role, pendingCount);

  return (
    <div className="flex min-h-dvh">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-background">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-sidebar lg:block">
        <SidebarBody me={staff} groups={groups} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Open menu" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SidebarBody me={staff} groups={groups} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <BrandMark className="text-base" />
        </header>
        <main id="admin-main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
