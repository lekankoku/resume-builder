import React from 'react';
import { Link } from 'react-router';

interface Props {
  title: string;
  subtitle?: React.ReactNode;
  breadcrumbs?: { label: string; to: string }[];
  actions?: React.ReactNode;
}

const PageHeader: React.FC<Props> = ({ title, subtitle, breadcrumbs, actions }) => (
  <header className="mb-8 space-y-2">
    {breadcrumbs && (
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        {breadcrumbs.map((crumb) => (
          <span key={crumb.to}>
            <Link to={crumb.to} className="hover:text-slate-900 hover:underline">
              {crumb.label}
            </Link>
            <span className="mx-2">/</span>
          </span>
        ))}
      </nav>
    )}
    <div className="flex justify-between items-start gap-6">
      <div>
        <h1 className="text-2xl font-display text-slate-900">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-slate-500">{subtitle}</div>}
      </div>
      {actions && <div className="flex gap-3 items-center shrink-0">{actions}</div>}
    </div>
  </header>
);

export default PageHeader;
