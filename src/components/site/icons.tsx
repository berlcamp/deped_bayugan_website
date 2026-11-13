import {
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Globe,
  Headset,
  LifeBuoy,
  Mail,
  Megaphone,
  Monitor,
  School,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Icons an admin can pick for a service or highlight. Keep in sync with the admin picker. */
export const SERVICE_ICONS: Record<string, LucideIcon> = {
  globe: Globe,
  briefcase: Briefcase,
  school: School,
  "file-text": FileText,
  users: Users,
  "book-open": BookOpen,
  "life-buoy": LifeBuoy,
  "graduation-cap": GraduationCap,
  "clipboard-list": ClipboardList,
  calendar: CalendarDays,
  megaphone: Megaphone,
  monitor: Monitor,
  building: Building2,
  mail: Mail,
  headset: Headset,
  shield: ShieldCheck,
};

export function ServiceIcon({ name, className = "i" }: { name: string; className?: string }) {
  const Icon = SERVICE_ICONS[name] ?? Globe;
  return <Icon className={className} aria-hidden="true" />;
}
