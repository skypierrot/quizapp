import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import React from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean; // 현재 페이지 여부
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`mb-4 ${className}`}>
      <ol className="flex items-center space-x-1 text-sm text-gray-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            )}
            {item.isCurrent ? (
              <span className="font-medium text-gray-700" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="hover:text-gray-700 hover:underline">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb; 