import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ManualForm } from "@/components/question/ManualForm"
import PasteForm from "@/components/question/PasteForm"
import Breadcrumb from '@/components/common/Breadcrumb';

export default function NewQuestionPage() {
  const breadcrumbItems = [
    { label: '홈', href: '/' },
    { label: '문제 등록', href: '/questions/new', isCurrent: true },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb items={breadcrumbItems} />
      <h1 className="text-2xl md:text-3xl font-bold mb-6">새 문제 생성</h1>
      
      <Tabs defaultValue="paste" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="paste">자동입력</TabsTrigger>
          <TabsTrigger value="manual">직접 입력</TabsTrigger>
        </TabsList>
        
        <TabsContent value="paste">
          <div className="p-4 rounded-lg border border-gray-200">
            <PasteForm />
          </div>
        </TabsContent>
        
        <TabsContent value="manual">
          <div className="p-4 rounded-lg border border-gray-200">
            <ManualForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 