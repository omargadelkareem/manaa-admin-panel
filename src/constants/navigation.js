import {
  Building2,
  CalendarClock,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  FileSpreadsheet,
  LayoutDashboard,
  Map,
  MapPinned,
  ReceiptText,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";

export const navigation = [
  {
    title: null,
    items: [
      {
        label: "الرئيسية",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
    ],
  },
  {
    title: "الموظفون",
    items: [
      {
        label: "جميع الموظفين",
        icon: Users,
        path: "/employees",
      },
      {
        label: "استيراد Excel",
        icon: FileSpreadsheet,
        path: "/employees/import",
      },
    ],
  },
  {
    title: "الحضور والدوام",
    items: [
      {
        label: "الحضور والانصراف",
        icon: Clock3,
        path: "/attendance",
      },
      {
        label: "المواقع والفروع",
        icon: MapPinned,
        path: "/locations",
      },
      {
        label: "التتبع المباشر",
        icon: Map,
        path: "/live-tracking",
      },
      {
        label: "الورديات",
        icon: CalendarClock,
        path: "/shifts",
      },
    ],
  },
  {
    title: "الإجازات",
    items: [
      {
        label: "طلبات الإجازة",
        icon: CalendarDays,
        path: "/leaves",
      },
    ],
  },
  {
    title: "المالية",
    items: [
      {
        label: "الرواتب",
        icon: WalletCards,
        path: "/payroll",
      },
      {
        label: "قسائم الرواتب",
        icon: ReceiptText,
        path: "/payslips",
      },
    ],
  },
  {
    title: "الإدارة",
    items: [
      {
        label: "التقارير",
        icon: ChartNoAxesCombined,
        path: "/reports",
      },
      {
        label: "بيانات الشركة",
        icon: Building2,
        path: "/settings/company",
      },
      {
        label: "إعدادات النظام",
        icon: Settings,
        path: "/settings/system",
      },
    ],
  },
];
