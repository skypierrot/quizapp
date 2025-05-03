import { ReactNode } from "react";
import Link from "next/link";
import { Home, Image, Settings, User } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* 사이드바 */}
      <div className="w-64 bg-gray-100 border-r p-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">관리자 페이지</h1>
        </div>
        
        <nav className="space-y-1">
          <Link href="/admin" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200">
            <Home className="h-5 w-5" />
            <span>대시보드</span>
          </Link>
          <Link href="/admin/images" className="flex items-center space-x-2 p-2 rounded bg-gray-200 text-blue-600 font-medium">
            <Image className="h-5 w-5" />
            <span>이미지 관리</span>
          </Link>
          <Link href="/admin/users" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200">
            <User className="h-5 w-5" />
            <span>사용자 관리</span>
          </Link>
          <Link href="/admin/settings" className="flex items-center space-x-2 p-2 rounded hover:bg-gray-200">
            <Settings className="h-5 w-5" />
            <span>시스템 설정</span>
          </Link>
        </nav>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
} 