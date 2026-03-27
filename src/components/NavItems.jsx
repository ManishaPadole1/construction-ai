import {
  LayoutDashboard,
  Upload,
  Brain,
  Building2,
  CheckSquare,
  FileText,
  FolderKanban,
  MessageSquare,
  Users,
  FileSearch,
  Sparkles,
} from "lucide-react";


export const navItemsEmployee = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/project", icon: Upload, label: "Upload Drawings", hidden: true },
  { path: "/projects", icon: FolderKanban, label: "Projects" },
  { path: "/quick-check", icon: FileSearch, label: "Quick Check" },
  { path: "/analysis", icon: Brain, label: "AI Analysis", hidden: true },
  { path: "/authorities", icon: Building2, label: "Authorities", hidden: true },
  {
    path: "/checklist",
    icon: CheckSquare,
    label: "Document Checklist",
    hidden: true,
  },
  {
    path: "/report",
    icon: FileText,
    label: "Feasibility Report",
    hidden: true,
  },
  {
    path: "/assistant",
    icon: MessageSquare,
    label: "AI Assistant",
  },
];


export const navItemsAdmin = [
  { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/employees", icon: Users, label: "Employees" },
];
