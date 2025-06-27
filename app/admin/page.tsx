"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Database, Image, RefreshCcw, Users } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">관리자 대시보드</h1>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          새로고침
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 이미지 관리 카드 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Image className="h-5 w-5 mr-2" />
              이미지 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">삭제 대기 이미지</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">전체 이미지 수</span>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">최근 업로드</span>
                <span className="font-medium">오늘</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/images">
                <Button variant="default" size="sm" className="w-full flex items-center justify-center gap-1">
                  이미지 관리로 이동
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 사용자 관리 카드 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Users className="h-5 w-5 mr-2" />
              사용자 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">총 사용자 수</span>
                <span className="font-medium">320</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">오늘 가입자</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">현재 접속자</span>
                <span className="font-medium">42</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/users">
                <Button variant="default" size="sm" className="w-full flex items-center justify-center gap-1">
                  사용자 관리로 이동
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 시스템 설정 카드 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Database className="h-5 w-5 mr-2" />
              시스템 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">서버 상태</span>
                <span className="font-medium text-green-500">정상</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">디스크 사용량</span>
                <span className="font-medium">24.5GB / 100GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">마지막 백업</span>
                <span className="font-medium">2023-12-01</span>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/admin/settings">
                <Button variant="default" size="sm" className="w-full flex items-center justify-center gap-1">
                  시스템 설정으로 이동
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 