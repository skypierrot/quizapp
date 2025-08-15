export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full text-center">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded mx-auto w-48"></div>
          <div className="h-4 bg-gray-200 rounded mx-auto w-64"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded mx-auto w-32"></div>
        </div>
        
        <div className="mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 text-sm mt-2">로딩 중...</p>
        </div>
      </div>
    </div>
  )
}
