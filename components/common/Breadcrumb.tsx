import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string; // href를 선택적으로 변경
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
            {item.isCurrent || !item.href ? ( // isCurrent가 true이거나 href가 없으면 span
              <span 
                className={item.isCurrent ? "font-medium text-gray-700" : ""}
                aria-current={item.isCurrent ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              // href가 undefined가 아님을 확신할 수 있을 때 non-null assertion 사용,
              // 또는 item.href를 직접 사용 (타입스크립트가 item.href가 string임을 추론)
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