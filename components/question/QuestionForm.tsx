"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { QuestionTag } from "@/db/schema"

// 폼 스키마 정의
const formSchema = z.object({
  content: z.string().min(2, {
    message: "문제 내용은 2글자 이상이어야 합니다.",
  }),
  contentImage: z.string().optional(),
  options: z.array(
    z.object({
      text: z.string().min(1, { message: "선택지 내용을 입력하세요" }),
      image: z.string().optional(),
    })
  ).min(2, { message: "최소 2개의 선택지가 필요합니다" }),
  answer: z.number().min(0, { message: "정답을 선택하세요" }),
  tags: z.object({
    year: z.string().min(1, { message: "연도를 선택하세요" }),
    subject: z.string().min(1, { message: "과목을 선택하세요" }),
    type: z.string().min(1, { message: "문제 유형을 선택하세요" }),
  }),
  explanation: z.string().optional(),
  explanationImage: z.string().optional(),
})

export function QuestionForm() {
  // React Hook Form 초기화
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      contentImage: "",
      options: [
        { text: "", image: "" },
        { text: "", image: "" },
        { text: "", image: "" },
        { text: "", image: "" },
      ],
      answer: 0,
      tags: {
        year: "2024",
        subject: "network",
        type: "multiple-choice",
      },
      explanation: "",
      explanationImage: "",
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // 폼 제출 처리
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error("문제 등록에 실패했습니다")

      // 성공 시 폼 초기화
      form.reset()
      alert("문제가 성공적으로 등록되었습니다.")
    } catch (error) {
      console.error("문제 등록 오류:", error)
      alert("문제 등록 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 선택지 추가
  const addOption = () => {
    const currentOptions = form.getValues().options
    form.setValue("options", [...currentOptions, { text: "", image: "" }])
  }

  // 선택지 삭제
  const removeOption = (index: number) => {
    const currentOptions = form.getValues().options
    if (currentOptions.length <= 2) return // 최소 2개 유지
    
    const newOptions = currentOptions.filter((_, i) => i !== index)
    form.setValue("options", newOptions)
    
    // 정답이 삭제된 선택지인 경우 정답 초기화
    const currentAnswer = form.getValues().answer
    if (currentAnswer === index) {
      form.setValue("answer", 0)
    } else if (currentAnswer > index) {
      form.setValue("answer", currentAnswer - 1)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 문제 내용 */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>문제 내용</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="문제 내용을 입력하세요" 
                  className="min-h-[150px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 문제 이미지 */}
        <FormField
          control={form.control}
          name="contentImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>문제 이미지 URL (선택사항)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 선택지 */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel className="text-base">선택지</FormLabel>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={addOption}
            >
              선택지 추가
            </Button>
          </div>
          
          {form.getValues().options.map((_, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name={`options.${index}.text`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>선택지 {index + 1}</FormLabel>
                      <FormControl>
                        <Input placeholder={`선택지 ${index + 1} 내용`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name={`options.${index}.image`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이미지 URL (선택)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="mt-8"
                onClick={() => removeOption(index)}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>

        {/* 정답 */}
        <FormField
          control={form.control}
          name="answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>정답</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  onChange={e => field.onChange(parseInt(e.target.value))}
                  value={field.value}
                >
                  {form.getValues().options.map((_, index) => (
                    <option key={index} value={index}>
                      선택지 {index + 1}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 태그 */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="tags.year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>연도</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    {...field}
                  >
                    <option value="2023">2023년</option>
                    <option value="2024">2024년</option>
                    <option value="2025">2025년</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tags.subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>과목</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    {...field}
                  >
                    <option value="network">네트워크</option>
                    <option value="database">데이터베이스</option>
                    <option value="os">운영체제</option>
                    <option value="security">보안</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tags.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>유형</FormLabel>
                <FormControl>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    {...field}
                  >
                    <option value="multiple-choice">객관식</option>
                    <option value="short-answer">주관식</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 해설 */}
        <FormField
          control={form.control}
          name="explanation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>해설 (선택사항)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="문제 해설을 입력하세요" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 해설 이미지 */}
        <FormField
          control={form.control}
          name="explanationImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>해설 이미지 URL (선택사항)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/explanation.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "등록 중..." : "문제 등록"}
        </Button>
      </form>
    </Form>
  )
} 