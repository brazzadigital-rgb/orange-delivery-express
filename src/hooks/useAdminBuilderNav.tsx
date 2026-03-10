import { Settings, Layers, DollarSign, PlusCircle, Pizza, Beef, Fish, Cherry, Soup, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { useBuilderLabels } from './useBuilderLabels';
import type { BuilderLabels } from '@/lib/store-type-config';

const builderIconMap: Record<BuilderLabels['admin']['iconName'], LucideIcon> = {
  Pizza,
  Beef,
  Fish,
  Cherry,
  Soup,
  UtensilsCrossed,
};

export function useAdminBuilderNav() {
  const labels = useBuilderLabels();
  const tabs = labels.admin.navTabs;
  const BuilderIcon = builderIconMap[labels.admin.iconName] || Pizza;

  const navItems = [
    { path: '/admin/pizza-builder/settings', label: tabs[0], icon: Settings },
    { path: '/admin/pizza-builder/sizes', label: tabs[1], icon: Layers },
    { path: '/admin/pizza-builder/flavors', label: tabs[2], icon: BuilderIcon },
    { path: '/admin/pizza-builder/prices', label: tabs[3], icon: DollarSign },
    { path: '/admin/pizza-builder/addons', label: tabs[4], icon: PlusCircle },
  ];

  return { navItems, pageTitle: labels.admin.pageTitle, demoCardDesc: labels.admin.demoCardDesc, labels, BuilderIcon };
}
