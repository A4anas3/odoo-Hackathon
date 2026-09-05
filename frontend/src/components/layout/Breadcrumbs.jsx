import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ROUTES } from '../../config/routes';

export function Breadcrumbs({ items }) {
  const location = useLocation();

  // Generate breadcrumbs from path if items not explicitly provided
  const breadcrumbItems = items || (() => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return pathnames.map((name, index) => {
      const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      const formattedName = name
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      return {
        label: formattedName,
        path: isLast ? null : routeTo,
      };
    });
  })();

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 py-2">
      <Link
        to={ROUTES.DASHBOARD}
        className="text-slate-400 hover:text-slate-700 transition-colors flex items-center"
        title="Dashboard"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {breadcrumbItems.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-slate-900 transition-colors capitalize font-medium text-slate-600"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-800 capitalize truncate max-w-xs">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
