import fs from 'fs/promises';
import path from 'path';
import { load } from 'cheerio'; // 올바른 cheerio 임포트
import { db } from '../db'; // Drizzle DB 인스턴스 경로 (실제 프로젝트에 맞게 수정)
import { exams, questions } from '../db/schema'; // Drizzle 스키마 (실제 프로젝트에 맞게 수정)
import { eq, and } from 'drizzle-orm';

// 이미지 경로와 같은 데이터를 저장하기 위한 타입 (필요시 확장)
interface ImageData {
  path: string;
  // base64?: string; // 필요하다면 이미지 내용을 직접 저장
}

async function main() {
  const filePath = path.join(process.cwd(), 'predata/건설안전기사/건설안전기사_20030316_result.html');

  try {
    const htmlContent = await fs.readFile(filePath, 'utf-8');
    const $ = load(htmlContent);

    // 1. 시험 정보 추출
    const examTitleText = $('h1').first().text();
    let examName = '';
    let examDateStr = ''; // YYYY-MM-DD

    const titleMatch = examTitleText.match(/(.+?)\s*\(((\d{4}-\d{2}-\d{2}).*?)\)/);
    if (titleMatch && titleMatch.length > 3) {
      examName = titleMatch[1]?.trim() || '';
      examDateStr = titleMatch[3] || '';
    } else {
      console.error('시험명 또는 날짜를 추출할 수 없습니다:', examTitleText);
      return;
    }

    console.log(`추출된 시험명: ${examName}, 날짜: ${examDateStr}`);

    const firstSubjectElement = $('h2').first();
    const subjectText = firstSubjectElement.text();
    const subjectName = subjectText.split(':')[1]?.trim() || '알 수 없는 과목';

    console.log(`추출된 과목명: ${subjectName}`);

    // 2. exams 테이블에 데이터 확인 및 삽입
    let examRecord = await db.select()
      .from(exams)
      .where(and(eq(exams.name, examName), eq(exams.date, examDateStr), eq(exams.subject, subjectName)))
      .limit(1)
      .then(rows => rows[0]);

    let examId: string;

    if (!examRecord) {
      console.log('기존 시험 정보 없음. 새 시험 정보 생성 중...');
      const newExamResult = await db.insert(exams).values({
        name: examName,
        date: examDateStr, // 스키마에 date (text) 필드가 있다고 가정
        subject: subjectName,
      }).returning({ id: exams.id });
      
      if (!newExamResult || newExamResult.length === 0) {
        console.error('새 시험 정보 생성 실패');
        return;
      }
      
      const newExam = newExamResult[0];
      if (!newExam || !newExam.id) {
        console.error('새 시험 정보에 ID가 없습니다.');
        return;
      }
      
      examId = newExam.id;
      examRecord = { id: examId, name: examName, date: examDateStr, subject: subjectName, createdAt: new Date(), updatedAt: new Date() }; // 스키마에 맞게 createdAt, updatedAt 추가 가정
      console.log(`새 시험 정보 생성 완료. ID: ${examId}`);
    } else {
      if (!examRecord.id) { // id가 없을 경우에 대한 방어 코드
        console.error('기존 시험 정보에 ID가 없습니다.');
        return;
      }
      examId = examRecord.id;
      console.log(`기존 시험 정보 사용. ID: ${examId}`);
    }

    // 3. 첫 번째 문제 데이터 추출
    const firstH3 = $('h3').filter((i: number, el: any) => $(el).text().trim() === '문제 1').first();
    const questionP = firstH3.nextAll('p').first();
    const questionUl = firstH3.nextAll('ul').first();

    if (questionP.length > 0 && questionUl.length > 0) {
         const questionContent = questionP.text().trim();
         const options: { text: string; images?: ImageData[] }[] = [];
         let answerIndex = -1;

         questionUl.find('li').each((i: number, liElem: any) => {
            const optionText = $(liElem).clone().children('b').remove().end().text().trim();
            options.push({ text: optionText });
            if ($(liElem).find('b').length > 0 && $(liElem).find('b').text().includes('(정답)')) {
              answerIndex = i;
            }
         });

         const questionImages: ImageData[] = [];
         questionP.find('img').each((i: number, imgElem: any) => {
            const imgSrc = $(imgElem).attr('src');
            if (imgSrc) {
                questionImages.push({ path: imgSrc });
            }
         });
        
        questionUl.find('li img').each((optIdx: number, imgElem: any) => {
            const imgSrc = $(imgElem).attr('src');
            if (imgSrc && options[optIdx]) {
                if (!options[optIdx].images) {
                    options[optIdx].images = [];
                }
                options[optIdx].images!.push({ path: imgSrc });
            }
        });

         console.log('\\\\n--- 첫 번째 문제 정보 ---');
         console.log('내용:', questionContent);
         console.log('선택지:', JSON.stringify(options, null, 2));
         console.log('정답 인덱스:', answerIndex);
         console.log('문제 이미지:', JSON.stringify(questionImages, null, 2));

         if (answerIndex === -1) {
            console.error('정답을 찾을 수 없습니다.');
            return;
         }

         // 4. questions 테이블에 문제 데이터 삽입
         const newQuestion = await db.insert(questions).values({
            content: questionContent,
            questionNumber: 1,
            options: options.map((opt, index) => ({ 
              number: index + 1, 
              text: opt.text, 
              images: opt.images || []
            })),
            answer: answerIndex,
            explanation: null,
            images: questionImages,
            explanationImages: [],
            userId: 'system-migration',
            examId: examId,
         } as any).returning({ id: questions.id });

         console.log('\\\\n새 문제 삽입 결과:', newQuestion);
         console.log('마이그레이션 성공: 첫 번째 문제');

    } else {
        console.error('첫 번째 문제의 내용(p) 또는 선택지(ul)를 찾을 수 없습니다.');
        return;
    }

  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
  }
}

main().catch(console.error); 