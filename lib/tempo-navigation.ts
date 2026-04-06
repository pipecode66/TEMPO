import {
  BarChart3,
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type WorkspaceNavigationItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const workspaceNavigation: WorkspaceNavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Vista general, alertas y avances de puesta en marcha.",
    icon: BarChart3,
  },
  {
    href: "/empleados",
    label: "Empleados",
    description: "Alta de personal, filtros operativos y control del equipo activo.",
    icon: Users,
  },
  {
    href: "/control-tiempo",
    label: "Control de tiempos",
    description: "Liquidacion diaria, recargos y validacion legal en linea.",
    icon: Clock3,
  },
  {
    href: "/calendario",
    label: "Calendario",
    description: "Lectura diaria y semanal de jornadas registradas.",
    icon: CalendarDays,
  },
  {
    href: "/reportes",
    label: "Reportes",
    description: "Resumenes exportables para nomina, operacion y cumplimiento.",
    icon: FileText,
  },
  {
    href: "/empresa",
    label: "Empresa",
    description: "Perfil organizacional y responsables internos de la operacion.",
    icon: Building2,
  },
  {
    href: "/configuracion",
    label: "Configuracion",
    description: "Parametros legales, alertas y reinicio seguro del workspace.",
    icon: Settings,
  },
];

export function getWorkspaceModule(pathname: string): WorkspaceNavigationItem {
  return (
    workspaceNavigation.find((item) =>
      pathname === item.href ? true : pathname.startsWith(`${item.href}/`),
    ) ?? workspaceNavigation[0]
  );
}
