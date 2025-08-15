"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Eye, Clock, AlertTriangle } from "lucide-react";

interface IImage {
  id: number;
  filename: string;
  originalName: string;
  path: string;
  type: string;
  size: number;
  mimeType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface IImageHistory {
  id: string;
  imageId: number;
  changeType: string;
  changedBy: string;
  reason: string;
  createdAt: string;
}

export default function ImageManagementPage() {
  const [pendingImages, setPendingImages] = useState<IImage[]>([]);
  const [historyRecords, setHistoryRecords] = useState<IImageHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<IImage | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<IImageHistory[]>([]);
  const [historyDialogOpen, setHistoryDialogOpen] = useState<boolean>(false);
  const [imageDialogOpen, setImageDialogOpen] = useState<boolean>(false);

  // 삭제 대기 이미지 목록 로드
  const loadPendingImages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/images/pending");
      if (!res.ok) throw new Error("삭제 대기 이미지 로드 중 오류가 발생했습니다.");
      const data = await res.json();
      setPendingImages(data);
    } catch (error) {
      console.error(error);
      alert("삭제 대기 이미지를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 이미지 변경 이력 로드
  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/images/history");
      if (!res.ok) throw new Error("이미지 변경 이력 로드 중 오류가 발생했습니다.");
      const data = await res.json();
      setHistoryRecords(data);
    } catch (error) {
      console.error(error);
      alert("이미지 변경 이력을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 특정 이미지의 변경 이력 로드
  const loadImageHistory = async (imageId: number) => {
    try {
      const res = await fetch(`/api/admin/images/history?imageId=${imageId}`);
      if (!res.ok) throw new Error("이미지 변경 이력 로드 중 오류가 발생했습니다.");
      const data = await res.json();
      setSelectedHistory(data);
      setHistoryDialogOpen(true);
    } catch (error) {
      console.error(error);
      alert("이미지 변경 이력을 불러오는 중 오류가 발생했습니다.");
    }
  };

  // 이미지 상태 변경 처리
  const handleImageAction = async (imageId: number, action: "approve" | "restore") => {
    if (!confirm(`정말로 이 이미지를 ${action === "approve" ? "삭제" : "복원"}하시겠습니까?`)) {
      return;
    }

    const reason = prompt(`${action === "approve" ? "삭제" : "복원"} 사유를 입력해주세요:`);
    if (reason === null) return; // 취소된 경우

    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "deleted" : "active",
          reason,
          userId: "관리자ID", // 실제 구현에서는 로그인한 사용자 ID를 사용
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "이미지 상태 변경 중 오류가 발생했습니다.");
      }

      // 목록 새로고침
      loadPendingImages();
      loadHistory();
      alert(`이미지가 성공적으로 ${action === "approve" ? "삭제" : "복원"}되었습니다.`);
    } catch (error) {
      console.error(error);
      alert(`이미지 ${action === "approve" ? "삭제" : "복원"} 중 오류가 발생했습니다.`);
    }
  };

  // 이미지 미리보기
  const handleImagePreview = (image: IImage) => {
    setSelectedImage(image);
    setImageDialogOpen(true);
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadPendingImages();
    loadHistory();
  }, []);

  // 상태에 따른 배지 스타일 결정
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">활성</Badge>;
      case "pending_deletion":
        return <Badge className="bg-yellow-500">삭제 대기</Badge>;
      case "deleted":
        return <Badge className="bg-red-500">삭제됨</Badge>;
      default:
        return <Badge className="bg-gray-500">알 수 없음</Badge>;
    }
  };

  // 변경 유형에 따른 배지 스타일 결정
  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case "create":
        return <Badge className="bg-blue-500">생성</Badge>;
      case "update":
        return <Badge className="bg-purple-500">수정</Badge>;
      case "delete_request":
        return <Badge className="bg-yellow-500">삭제 요청</Badge>;
      case "restore":
        return <Badge className="bg-green-500">복원</Badge>;
      case "delete":
        return <Badge className="bg-red-500">삭제</Badge>;
      default:
        return <Badge className="bg-gray-500">알 수 없음</Badge>;
    }
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // 날짜 포맷
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">이미지 관리</h1>
      
      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            삭제 대기 이미지
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            변경 이력
          </TabsTrigger>
        </TabsList>
        
        {/* 삭제 대기 이미지 탭 */}
        <TabsContent value="pending">
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPendingImages}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : pendingImages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              삭제 대기 중인 이미지가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>파일명</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>크기</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingImages.map((image) => (
                  <TableRow key={image.id}>
                    <TableCell>{image.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{image.originalName}</TableCell>
                    <TableCell>{image.type}</TableCell>
                    <TableCell>{formatFileSize(image.size)}</TableCell>
                    <TableCell>{getStatusBadge(image.status)}</TableCell>
                    <TableCell>{formatDate(image.createdAt)}</TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImagePreview(image)}
                        className="flex items-center gap-1 px-2 py-1 h-8"
                      >
                        <Eye className="h-3 w-3" />
                        보기
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleImageAction(image.id, "approve")}
                        className="px-2 py-1 h-8"
                      >
                        삭제 승인
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleImageAction(image.id, "restore")}
                        className="px-2 py-1 h-8"
                      >
                        복원
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => loadImageHistory(image.id)}
                        className="px-2 py-1 h-8"
                      >
                        이력
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        
        {/* 변경 이력 탭 */}
        <TabsContent value="history">
          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadHistory}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : historyRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              이미지 변경 이력이 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이미지 ID</TableHead>
                  <TableHead>변경 유형</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>변경일</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.imageId}</TableCell>
                    <TableCell>{getChangeTypeBadge(record.changeType)}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{record.reason}</TableCell>
                    <TableCell>{formatDate(record.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => loadImageHistory(record.imageId)}
                        className="px-2 py-1 h-8"
                      >
                        상세 이력
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
      
      {/* 이미지 미리보기 다이얼로그 */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>이미지 관리</DialogTitle>
            <DialogDescription>이미지 관리 설명</DialogDescription>
          </DialogHeader>
          
          {selectedImage && (
            <div className="mt-4 flex justify-center">
              <img
                src={selectedImage.path}
                alt={selectedImage.originalName}
                className="max-h-[400px] object-contain border rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 이미지 변경 이력 다이얼로그 */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>이미지 변경 이력</DialogTitle>
            <DialogDescription>
              이미지 ID: {selectedHistory.length > 0 && selectedHistory[0] ? selectedHistory[0].imageId : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {selectedHistory.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                이미지 변경 이력이 없습니다.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>변경 유형</TableHead>
                    <TableHead>사유</TableHead>
                    <TableHead>변경일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{getChangeTypeBadge(record.changeType)}</TableCell>
                      <TableCell>{record.reason}</TableCell>
                      <TableCell>{formatDate(record.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 