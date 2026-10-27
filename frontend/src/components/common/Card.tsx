import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  hoverable = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden transition-all duration-200',
        hoverable && 'hover:shadow-card hover:border-slate-300',
        className
      )}
      {...props}
    >
      {header && <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">{header}</div>}
      <div className="p-5">{children}</div>
      {footer && <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">{footer}</div>}
    </div>
  );
};
