/**
 * components/common/CategoryBadge.jsx — Category Visual Badge
 * Pocket C.A. Frontend
 *
 * Displays a colored pill with the category icon and label.
 */

import {
  Briefcase, Laptop, TrendingUp, Utensils, Car, Home,
  Zap, Heart, Film, BookOpen, ShoppingBag, CreditCard,
  Shield, MoreHorizontal,
} from 'lucide-react';
import { getCategoryById } from '../../constants/categories';

const ICON_MAP = {
  Briefcase, Laptop, TrendingUp, Utensils, Car, Home,
  Zap, Heart, Film, BookOpen, ShoppingBag, CreditCard,
  Shield, MoreHorizontal,
};

const CategoryBadge = ({ categoryId, size = 'sm' }) => {
  const cat = getCategoryById(categoryId);
  const Icon = ICON_MAP[cat.icon] || MoreHorizontal;

  const sizes = {
    sm: { pill: 'px-2 py-1 text-xs gap-1', icon: 12 },
    md: { pill: 'px-3 py-1.5 text-sm gap-1.5', icon: 14 },
  };

  const s = sizes[size] || sizes.sm;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${s.pill}`}
      style={{
        background: `${cat.color}18`,
        color: cat.color,
        border: `1px solid ${cat.color}30`,
      }}
    >
      <Icon size={s.icon} />
      {cat.label}
    </span>
  );
};

export default CategoryBadge;
