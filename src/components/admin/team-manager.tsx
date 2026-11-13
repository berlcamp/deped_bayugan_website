"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Copy, Crown, Loader2, MoreHorizontal, ShieldCheck, UserMinus, UserPlus, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { inviteStaff, removeStaff, updateStaff } from "@/app/(admin)/admin/actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { RelTime } from "@/components/site/rel-time";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Role, Staff } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_INFO: Record<Role, string> = {
  editor: "Writes posts and submits them",
  admin: "Reviews, publishes and manages settings",
};

function StatusPill({ status }: { status: Staff["status"] }) {
  const map = {
    active: { label: "Active", cls: "bg-success-tint text-success" },
    invited: { label: "Invited", cls: "bg-warning-tint text-warning" },
    disabled: { label: "Disabled", cls: "bg-muted text-muted-foreground" },
  }[status];
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold", map.cls)}>{map.label}</span>;
}

export function TeamManager({ staff, meId, loginUrl }: { staff: Staff[]; meId: string; loginUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("editor");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const invite = () =>
    start(async () => {
      setError(null);
      const res = await inviteStaff({ email, role });
      if (!res.ok) return setError(res.error);
      toast.success(`${email.trim().toLowerCase()} can now sign in`, { description: "Send them the sign-in link below." });
      setEmail("");
      router.refresh();
    });

  const change = (id: string, patch: { role?: Role; status?: "active" | "disabled" }, message: string) =>
    start(async () => {
      const res = await updateStaff(id, patch);
      if (!res.ok) return void toast.error(res.error);
      toast.success(message);
      router.refresh();
    });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-5" aria-labelledby="invite-h">
        <h2 id="invite-h" className="flex items-center gap-2 text-lg font-bold">
          <UserPlus className="size-5 text-brand" aria-hidden="true" /> Invite someone
        </h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            invite();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Google email address</Label>
            <Input
              id="invite-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@gmail.com"
              className="h-10"
              aria-invalid={!!error}
              aria-describedby={error ? "invite-error" : undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole((v as Role) ?? "editor")}>
              <SelectTrigger id="invite-role" className="h-10 w-full">
                <SelectValue>{(v: Role) => (v === "admin" ? "Admin" : "Editor")}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="h-10 rounded-lg px-5" disabled={pending || !email.trim()}>
            {pending && <Loader2 className="animate-spin" />}
            Invite
          </Button>
        </form>
        {error && (
          <p id="invite-error" role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{ROLE_INFO[role]}.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted/70 px-3 py-2.5 text-sm">
          <span className="text-muted-foreground">Sign-in link:</span>
          <code className="min-w-0 flex-1 truncate font-medium">{loginUrl}</code>
          <Button type="button" variant="outline" size="sm" className="h-8 bg-card" onClick={copyLink}>
            {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </section>

      <section aria-labelledby="members-h">
        <h2 id="members-h" className="mb-3 text-lg font-bold">
          Members <span className="font-normal text-muted-foreground">({staff.length})</span>
        </h2>
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {staff.map((s) => {
            const isMe = s.id === meId;
            const name = s.full_name || s.email.split("@")[0];
            return (
              <li key={s.id} className={cn("flex items-center gap-3 px-4 py-3.5 sm:px-5", s.status === "disabled" && "opacity-70")}>
                <Avatar className="size-10">
                  {s.avatar_url && <AvatarImage src={s.avatar_url} alt="" referrerPolicy="no-referrer" />}
                  <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 font-semibold">
                    <span className="truncate">{name}</span>
                    {isMe && <span className="text-xs font-medium text-muted-foreground">(you)</span>}
                    {s.is_super_admin && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
                        <Crown className="size-3.5" aria-hidden="true" /> Owner
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {s.email}
                    {s.status === "invited" ? (
                      <>
                        {" "}
                        · invited <RelTime iso={s.invited_at} />
                      </>
                    ) : s.last_sign_in_at ? (
                      <>
                        {" "}
                        · last signed in <RelTime iso={s.last_sign_in_at} />
                      </>
                    ) : null}
                  </p>
                </div>
                <span className="hidden items-center gap-1.5 text-sm font-medium capitalize sm:flex">
                  {s.role === "admin" && <ShieldCheck className="size-4 text-brand" aria-hidden="true" />}
                  {s.role}
                </span>
                <StatusPill status={s.status} />
                {!isMe && !s.is_super_admin ? (
                  <ConfirmDialog
                    title={`Remove ${name}?`}
                    description="They won't be able to sign in anymore. Their posts stay on the site with their byline."
                    confirmLabel="Remove"
                    onConfirm={async () => {
                      const res = await removeStaff(s.id);
                      if (!res.ok) {
                        toast.error(res.error);
                        return false;
                      }
                      toast.success(`${name} removed`);
                      router.refresh();
                    }}
                    trigger={(openConfirm) => (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" aria-label={`Manage ${name}`} disabled={pending} />}>
                          <MoreHorizontal className="size-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Role</DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                              value={s.role}
                              onValueChange={(v) => v !== s.role && change(s.id, { role: v as Role }, `${name} is now ${v === "admin" ? "an admin" : "an editor"}`)}
                            >
                              <DropdownMenuRadioItem value="editor">Editor</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          {s.status === "disabled" ? (
                            <DropdownMenuItem onClick={() => change(s.id, { status: "active" }, `${name} can sign in again`)}>
                              <UserCheck /> Turn access back on
                            </DropdownMenuItem>
                          ) : s.status === "active" ? (
                            <DropdownMenuItem onClick={() => change(s.id, { status: "disabled" }, `${name}'s access is turned off`)}>
                              <UserX /> Turn off access
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem variant="destructive" onClick={openConfirm}>
                            <UserMinus /> {s.status === "invited" ? "Cancel invite" : "Remove from team"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  />
                ) : (
                  <span className="size-10" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
