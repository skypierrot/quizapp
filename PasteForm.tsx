import { useEffect, useState } from 'react';

function PasteForm() {
  const [isActive, setIsActive] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(document.hasFocus());
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  
  const handlePasteAreaClick = (e: React.MouseEvent) => {
    if (isWindowFocused) {
      setIsActive(true);  // 창이 포커스된 상태에서 클릭 시 활성화
    }
  };
  
  const handleMouseOver = (e: React.MouseEvent) => {
    if (isWindowFocused) {
      setIsActive(true);  // 창이 포커스된 상태에서 마우스 오버 시 활성화
    }
  };
  
  const setQuestionAnswer = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };
  
  return (
    <div
      onClick={handlePasteAreaClick}
      onMouseOver={handleMouseOver}
      onBlur={() => setIsActive(false)}  // 포커스 잃을 때 비활성화
      style={{ border: isActive ? '2px solid blue' : '1px solid gray' }}  // Visual feedback
    >
      // Paste area content
    </div>
  );
}

export default PasteForm; 