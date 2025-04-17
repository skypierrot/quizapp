'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IExamInstance } from '@/types'; // Assuming types are defined in @/types
import Breadcrumb from '@/components/common/Breadcrumb'; // Import Breadcrumb

interface IExamInstancesResponse {
  examInstances: IExamInstance[];
}

export default function ExamDetailPage() {
  const params = useParams();
  const [decodedExamName, setDecodedExamName] = useState<string | null>(null);
  const [examInstances, setExamInstances] = useState<IExamInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const examNameParam = params.examName; // Get raw param from URL

    // Ensure param is a string before processing
    if (typeof examNameParam === 'string') {
      try {
        // Decode the exam name from the URL
        const decodedName = decodeURIComponent(examNameParam);
        setDecodedExamName(decodedName);

        // Function to fetch exam instances based on the decoded exam name
        const fetchExamInstances = async () => {
          setLoading(true);
          setError(null);
          try {
            // Use relative path for API calls from client components
            const apiUrl = '/api/exam-instances'; 
            // Encode the tag value properly for the query parameter
            const encodedTag = encodeURIComponent(`시험명:${decodedName}`);
            const response = await fetch(`${apiUrl}?tags=${encodedTag}`, {
              cache: 'no-store', // Fetch fresh data every time
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({})); // Try to parse error message
              throw new Error(errorData.error || `API 호출 실패: ${response.statusText}`);
            }

            const data: IExamInstancesResponse = await response.json();
            // Sort instances, e.g., by year and session descending
            const sortedInstances = (data.examInstances || []).sort((a, b) => {
              if (a.year !== b.year) {
                return b.year.localeCompare(a.year); // Sort by year descending
              }
              return b.session.localeCompare(a.session); // Then by session descending
            });
            setExamInstances(sortedInstances);

          } catch (err) {
            console.error("Exam instances loading failed:", err);
            setError(err instanceof Error ? err.message : "데이터를 불러오는 중 오류가 발생했습니다.");
            setExamInstances([]); // Clear instances on error
          } finally {
            setLoading(false); // Ensure loading is set to false in all cases
          }
        };

        fetchExamInstances(); // Call the fetch function

      } catch (e) {
        // Handle potential errors during URI decoding
        console.error("Error decoding exam name:", e);
        setError("잘못된 시험명 형식입니다.");
        setLoading(false);
      }
    } else {
      // Handle cases where the parameter is missing or not a string
      setError("시험명을 URL에서 찾을 수 없습니다.");
      setLoading(false);
    }
    // Dependency array: re-run effect if the raw parameter changes
  }, [params.examName]); 

  // Render loading state
  if (loading) {
    return <div className="container mx-auto py-8 text-center">로딩 중...</div>;
  }

  // Render error state
  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">오류: {error}</div>;
  }

  // Define breadcrumb items dynamically
  const breadcrumbItems = decodedExamName ? [
    { label: '홈', href: '/' },
    { label: '문제 은행', href: '/bank' },
    { label: decodedExamName, href: '', isCurrent: true }, // Current page
  ] : []; // Render empty if name not decoded yet

  return (
    <div className="container mx-auto py-8">
      {/* Add Breadcrumb component */} 
      <Breadcrumb items={breadcrumbItems} />

      {/* Display only the decoded exam name as the page title */}
      <h1 className="text-3xl font-bold mb-6">{decodedExamName}</h1>
      
      {/* Show message if no instances found */}
      {!loading && !error && examInstances.length === 0 ? (
        <p className="text-gray-500">해당 시험으로 등록된 회차가 없습니다.</p>
      ) : (
        // Render the grid of exam instance cards - Max 5 columns on xl screens
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
          {examInstances.map((instance) => {
            // Encode parameters for the study page URL
            const encodedExamNameParam = encodeURIComponent(instance.examName);
            const encodedYearParam = encodeURIComponent(instance.year);
            const encodedSessionParam = encodeURIComponent(instance.session);
            // Construct the URL for the study page
            const studyUrl = `/study/${encodedExamNameParam}/${encodedYearParam}/${encodedSessionParam}`;
            // Create a unique key for each card
            const cardKey = `${instance.year}-${instance.session}`; 

            return (
              // Link each card to the corresponding study page
              <Link href={studyUrl} key={cardKey}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col">
                  <CardHeader className="py-3">
                    {/* Explicitly set flex-direction to row on small screens */}
                    <div className="block max-sm:flex max-sm:flex-row max-sm:items-baseline max-sm:justify-between">
                      {/* Inner div for Title (Year + Session) */}
                      <div className="text-xl font-bold mb-1 max-sm:mb-0 max-sm:mr-2">
                        {instance.year}년 {instance.session}
                      </div>
                      {/* Inner div for Question Count */}
                      <div className="text-sm text-gray-600 max-sm:flex-shrink-0">
                        문항 수: {instance.questionCount}개
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
} 