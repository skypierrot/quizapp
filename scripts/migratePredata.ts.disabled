import fs from 'fs/promises';
import path from 'path';
import { db } from '@/db'; // 데이터베이스 인스턴스
import { exams, questions, images as imagesSchema } from '@/db/schema'; // Drizzle 스키마
import { eq, and, sql, inArray } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';
import * as cheerio from 'cheerio'; // HTML 파싱용 (네임스페이스 임포트)

// Node.js 전역 타입 정의
declare global {
  var process: any;
}

const PREDATA_DIR = path.join(process.cwd(), 'predata');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'uploaded');
const PROGRESS_FILE = path.join(process.cwd(), 'scripts', 'migration_progress.json');
const ERROR_LOG_FILE = path.join(process.cwd(), 'scripts', 'migration_errors.log');

interface ParsedOption {
  number: number;
  text: string;
  images: { url: string; hash: string }[];
}

interface ParsedQuestion {
  examName: string;
  examDate: string; // "YYYY-MM-DD"
  subject: string;
  questionNumber?: number;
  questionContent: string; // 문제 번호가 제거된 문제 내용
  options: ParsedOption[];
  answerIndex: number;
  questionImages: { url: string; hash: string }[];
}

interface MigrateOptions {
  singleFile?: string; // 테스트할 단일 HTML 파일 경로 (PREDATA_DIR 기준 상대 경로 또는 절대 경로)
  targetExamName?: string; // 특정 시험명 폴더를 대상으로 지정
  runAll?: boolean; // 모든 파일을 처리하는 모드
  dryRun?: boolean; // 실제 DB 작업 없이 파싱만 수행
  limit?: number; // 처리할 총 파일 수 제한 (테스트용)
  resume?: boolean; // 중단된 지점부터 재개
  force?: boolean; // 강제로 모든 파일 재처리
  skipProcessed?: boolean; // 이미 처리된 파일 스킵 (기본값: true)
  retryFailed?: boolean; // 실패한 파일 재시도
}

interface MigrationProgress {
  lastUpdated: number;
  totalFiles: number;
  processedFiles: number;
  failedFiles: string[];
  successfulFiles: string[];
  currentFile?: string;
  startTime?: number;
  estimatedTimeRemaining?: string;
  performanceMetrics: {
    filesPerMinute: number;
    averageProcessingTime: number;
    totalProcessingTime: number;
  };
  databaseStats: {
    totalQuestions: number;
    totalExams: number;
    lastProcessedExam?: string;
  };
}

interface FileProcessingStatus {
  filePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  lastAttempt?: string;
  errorCount: number;
  maxRetries: number;
  lastError?: string;
  retryAfter?: number; // 재시도 대기 시간 (밀리초)
}

// --- 데이터베이스 기반 진행상태 확인 함수들 ---
async function getDatabaseStats(): Promise<{ totalQuestions: number; totalExams: number; lastProcessedExam?: string }> {
  try {
    const [questionsResult, examsResult] = await Promise.all([
      db.select({ count: sql`count(*)` }).from(questions),
      db.select({ count: sql`count(*)` }).from(exams)
    ]);

    const totalQuestions = Number(questionsResult[0]?.count || 0);
    const totalExams = Number(examsResult[0]?.count || 0);

    // 마지막으로 처리된 시험 확인
    let lastProcessedExam: string | undefined;
    if (totalQuestions > 0) {
      const lastQuestion = await db
        .select({ examName: exams.name })
        .from(questions)
        .leftJoin(exams, eq(questions.examId, exams.id))
        .orderBy(sql`questions.created_at DESC`)
        .limit(1);
      
      lastProcessedExam = lastQuestion[0]?.examName;
    }

    return { totalQuestions, totalExams, lastProcessedExam };
  } catch (error) {
    console.error('데이터베이스 통계 조회 실패:', error);
    return { totalQuestions: 0, totalExams: 0 };
  }
}

async function isFileAlreadyProcessed(filePath: string): Promise<boolean> {
  try {
    // 파일 경로에서 시험명과 날짜 추출
    const fileName = path.basename(filePath);
    const examDir = path.dirname(filePath).split(path.sep).pop();
    
    if (!examDir) return false;

    // 해당 시험명으로 등록된 문제가 있는지 확인
    const examQuestions = await db
      .select({ count: sql`count(*)` })
      .from(questions)
      .leftJoin(exams, eq(questions.examId, exams.id))
      .where(eq(exams.name, examDir));

    return (Number(examQuestions[0]?.count) || 0) > 0;
  } catch (error) {
    console.error('파일 처리 상태 확인 실패:', error);
    return false;
  }
}

async function getProcessedFilesList(): Promise<string[]> {
  try {
    const stats = await getDatabaseStats();
    if (stats.totalQuestions === 0) return [];

    // 데이터베이스에 있는 시험명들을 기준으로 처리된 파일 목록 생성
    const examNames = await db.select({ name: exams.name }).from(exams);
    
    const processedFiles: string[] = [];
    for (const exam of examNames) {
      const examDir = path.join(PREDATA_DIR, exam.name);
      try {
        const files = await fs.readdir(examDir);
        for (const file of files) {
          if (file.endsWith('_result.html') || file.endsWith('_results.html')) {
            processedFiles.push(path.join(examDir, file));
          }
        }
      } catch (error) {
        // 디렉토리가 존재하지 않는 경우 무시
        continue;
      }
    }

    return processedFiles;
  } catch (error) {
    console.error('처리된 파일 목록 조회 실패:', error);
    return [];
  }
}

// Bulk 스킵을 위한 새로운 함수들
async function bulkCheckExistingQuestions(
  parsedQuestions: ParsedQuestion[], 
  examId: string
): Promise<Set<string>> {
  try {
    // 문제 내용을 기준으로 중복 체크
    const questionContents = parsedQuestions.map((q: ParsedQuestion) => q.questionContent);
    
    const existingQuestions = await db
      .select({ content: questions.content })
      .from(questions)
      .where(and(
        eq(questions.examId, examId),
        inArray(questions.content, questionContents)
      ));
    
    return new Set(existingQuestions.map((q: { content: string }) => q.content));
  } catch (error) {
    console.error('Bulk 중복 체크 실패:', error);
    return new Set();
  }
}

async function getBulkExamStatus(): Promise<Map<string, { questionCount: number; isComplete: boolean }>> {
  try {
    const result = await db
      .select({
        examName: exams.name,
        questionCount: sql`count(${questions.id})`,
        examId: exams.id
      })
      .from(exams)
      .leftJoin(questions, eq(exams.id, questions.examId))
      .groupBy(exams.id, exams.name)
      .orderBy(exams.name);

    const examStatus = new Map<string, { questionCount: number; isComplete: boolean }>();
    
    for (const row of result) {
      // exam 이름에서 파일명 추출 (예: "건설안전기사" -> "건설안전기사.html")
      const fileName = `${row.examName}.html`;
      examStatus.set(fileName, {
        questionCount: Number(row.questionCount as string | number),
        isComplete: Number(row.questionCount as string | number) > 0 // 문제가 있으면 완료된 것으로 간주
      });
    }
    
    return examStatus;
  } catch (error) {
    console.error('❌ Bulk exam status 조회 실패:', error);
    return new Map();
  }
}

async function shouldSkipFile(filePath: string, examStatus: Map<string, { questionCount: number; isComplete: boolean }>): Promise<boolean> {
  try {
    // 파일 경로에서 exam 디렉토리명 추출
    const pathParts = filePath.split(path.sep);
    const examDirIndex = pathParts.findIndex(part => part === 'predata') + 1;
    const examDirName = pathParts[examDirIndex];
    
    if (!examDirName) return false;
    
    // exam 상태 확인
    const status = examStatus.get(examDirName);
    if (status && status.isComplete) {
      console.log(`⏭️  ${examDirName}: 이미 완료됨 (${status.questionCount}개 문제)`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ 파일 스킵 체크 실패 (${filePath}):`, error);
    return false;
  }
}

// --- 진행상태 관리 함수들 ---
async function loadProgress(): Promise<MigrationProgress> {
  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf-8');
    const progress = JSON.parse(data);
    
    // 데이터베이스 통계 업데이트
    progress.databaseStats = await getDatabaseStats();
    
    return progress;
  } catch (error) {
    // 파일이 없거나 읽기 실패 시 기본값 반환
    const databaseStats = await getDatabaseStats();
    return {
      lastUpdated: Date.now(),
      totalFiles: 0,
      processedFiles: 0,
      failedFiles: [],
      successfulFiles: [],
      startTime: Date.now(),
      performanceMetrics: {
        filesPerMinute: 0,
        averageProcessingTime: 0,
        totalProcessingTime: 0
      },
      databaseStats
    };
  }
}

async function saveProgress(progress: MigrationProgress): Promise<void> {
  try {
    // 데이터베이스 통계 업데이트
    progress.databaseStats = await getDatabaseStats();
    progress.lastUpdated = Date.now();
    
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (error) {
    console.error('진행상태 저장 실패:', error);
  }
}

async function updateProgress(
  progress: MigrationProgress,
  filePath: string,
  success: boolean,
  totalFiles: number
): Promise<MigrationProgress> {
  if (success) {
    progress.successfulFiles.push(filePath);
    progress.processedFiles++;
    
    // 실패 목록에서 제거
    progress.failedFiles = progress.failedFiles.filter(f => f !== filePath);
  } else {
    if (!progress.failedFiles.includes(filePath)) {
      progress.failedFiles.push(filePath);
    }
  }

  // 진행률 계산
  const progressPercent = ((progress.processedFiles / totalFiles) * 100).toFixed(2);
  console.log(`📊 진행률: ${progress.processedFiles}/${totalFiles} (${progressPercent}%)`);

  // 예상 완료 시간 계산
  if (progress.startTime && progress.processedFiles > 0) {
    const startTime = new Date(progress.startTime);
    const now = new Date();
    const elapsed = now.getTime() - startTime.getTime();
    const avgTimePerFile = elapsed / progress.processedFiles;
    const remainingFiles = totalFiles - progress.processedFiles;
    const estimatedTimeRemaining = new Date(now.getTime() + (avgTimePerFile * remainingFiles));
    
    progress.estimatedTimeRemaining = estimatedTimeRemaining.toISOString();
    
    const remainingHours = Math.floor(remainingFiles * avgTimePerFile / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingFiles * avgTimePerFile % (1000 * 60 * 60)) / (1000 * 60));
    
    if (remainingHours > 0) {
      console.log(`⏰ 예상 완료 시간: ${remainingHours}시간 ${remainingMinutes}분 후`);
    } else {
      console.log(`⏰ 예상 완료 시간: ${remainingMinutes}분 후`);
    }
  }

  return progress;
}

// --- 에러 로깅 함수 ---
async function logError(filePath: string, error: any, context?: string): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ${filePath}: ${error.message || error}\n${context || ''}\n${error.stack || ''}\n---\n`;
    
    await fs.appendFile(ERROR_LOG_FILE, errorMessage);
  } catch (logError) {
    console.error('에러 로깅 실패:', logError);
  }
}

// --- 진행상태 표시 함수 ---
function displayProgress(progress: MigrationProgress, currentFile?: string): void {
  console.log('\n📋 마이그레이션 진행상황');
  console.log(`   총 파일 수: ${progress.totalFiles}`);
  console.log(`   처리 완료: ${progress.processedFiles}`);
  console.log(`   성공: ${progress.successfulFiles.length}`);
  console.log(`   실패: ${progress.failedFiles.length}`);
  
  if (progress.databaseStats) {
    console.log(`   데이터베이스 문제 수: ${progress.databaseStats.totalQuestions.toLocaleString()}`);
    console.log(`   등록된 시험 수: ${progress.databaseStats.totalExams}`);
    if (progress.databaseStats.lastProcessedExam) {
      console.log(`   마지막 처리 시험: ${progress.databaseStats.lastProcessedExam}`);
    }
  }
  
  if (progress.startTime) {
    const startTime = new Date(progress.startTime);
    const now = new Date();
    const elapsed = now.getTime() - startTime.getTime();
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    console.log(`   경과 시간: ${hours}시간 ${minutes}분`);
  }
  
  if (currentFile) {
    console.log(`   현재 처리 중: ${path.basename(currentFile)}`);
  }
}

// --- 이미지 처리 함수 ---
async function processImage(
  htmlFilePath: string,
  imageRelativePathFromHtml: string,
  dryRun: boolean = false
): Promise<{ url: string; hash: string } | null> {
  if (!imageRelativePathFromHtml) return null;

  const imageAbsolutePath = path.resolve(path.dirname(htmlFilePath), imageRelativePathFromHtml);

  try {
    const buffer = await fs.readFile(imageAbsolutePath);
    const hash = createHash('sha256').update(buffer).digest('hex');

    const existingImages = await db.select().from(imagesSchema).where(eq(imagesSchema.hash, hash)).limit(1);
    let fileUrl: string;

    if (existingImages.length > 0 && existingImages[0]) {
      fileUrl = existingImages[0].path;
      console.log(`[ImageProcess] Hash ${dryRun ? '(Dry Run) ' : ''}found ${hash}, using existing path: ${fileUrl}`);
    } else {
      const ext = path.extname(imageRelativePathFromHtml) || '.png';
      const uniqueFilename = `${randomUUID()}${ext}`;
      fileUrl = path.join('/images', 'uploaded', uniqueFilename).replace(/\\/g, '/');

      if (dryRun) {
        console.log(`[ImageProcess] (Dry Run) New image ${hash} would be saved as: ${fileUrl} (Original: ${imageRelativePathFromHtml})`);
      } else {
        const newFilePath = path.join(UPLOAD_DIR, uniqueFilename);
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        await fs.writeFile(newFilePath, buffer);
        await db.insert(imagesSchema).values({ hash: hash, path: fileUrl });
        console.log(`[ImageProcess] New image ${hash} saved: ${fileUrl}`);
      }
    }
    return { url: fileUrl, hash: hash };
  } catch (error) {
    console.error(`[ImageProcess] Error processing image ${imageRelativePathFromHtml} (from ${htmlFilePath}):`, error);
    if (String(error).includes('ENOENT')) {
        console.error(`[ImageProcess] HINT: Check if image file exists at calculated path: ${imageAbsolutePath}`);
    }
    return null;
  }
}

// --- HTML 파싱 및 데이터 추출 함수 ---
async function parseHtmlFile(filePath: string, dryRun: boolean = false): Promise<ParsedQuestion[]> {
  console.log(`[ParseHtml] Attempting to parse ${filePath}...`);
  let htmlContent;
  try {
    htmlContent = await fs.readFile(filePath, 'utf-8');
    console.log(`[ParseHtml] Successfully read file: ${filePath}`);
  } catch (error) {
    console.error(`[ParseHtml] Error reading file ${filePath}:`, error);
    return []; // 파일 읽기 실패 시 빈 배열 반환
  }

  const $ = cheerio.load(htmlContent);
  const questionsData: ParsedQuestion[] = [];

  const examTitleFull = $('h1').first().text().trim();
  const examNameMatch = examTitleFull.match(/^(.*?)\s*\(/);
  const examDateMatch = examTitleFull.match(/\((\d{4}-\d{2}-\d{2}).*?\)/);

  const examName = examNameMatch ? examNameMatch[1].trim() : 'N/A';
  const examDate = examDateMatch ? examDateMatch[1].trim() : 'N/A';

  if (examName === 'N/A' || examDate === 'N/A') {
    console.warn(`[ParseHtml] Could not parse examName or examDate from title: "${examTitleFull}" in file: ${filePath}. Skipping this file.`);
    return [];
  }
  
  let currentSubject = 'N/A';
  const bodyChildren = $('body').children();
  
  for (let i = 0; i < bodyChildren.length; i++) {
    const el = $(bodyChildren[i]);

    if (el.is('h2')) {
      currentSubject = el.text().replace(/^\d+과목:\s*/, '').trim();
      console.log(`[DebugParse] Current subject changed to: ${currentSubject}`);
    } else if (el.is('h3')) {
      const h3Text = el.text().trim();
      console.log(`[DebugParse] Found H3. Raw h3Text: "${h3Text}", Current Subject: ${currentSubject}`);
      
      let questionNumber: number | undefined = undefined;
      const titleNumberMatch = h3Text.match(/^문제\s*(\d+)/);

      if (titleNumberMatch && titleNumberMatch[1]) {
        questionNumber = parseInt(titleNumberMatch[1], 10);
        console.log(`[DebugParse] Matched question number from H3: ${questionNumber} from "${h3Text}"`);
      } else {
        const fallbackMatch = h3Text.match(/^(\d+)\.\s*/);
        if (fallbackMatch && fallbackMatch[1]) {
            questionNumber = parseInt(fallbackMatch[1], 10);
            console.log(`[DebugParse] Matched question number from H3 (fallback): ${questionNumber} from "${h3Text}"`);
        } else {
            console.log(`[DebugParse] No question number match in H3 title: "${h3Text}", Current Subject: ${currentSubject}`);
        }
      }

      let questionP: any | null = null;
      let questionUl: any | null = null;
      let questionImagesInP: { url: string; hash: string }[] = [];
      let questionImagesAfterP: { url: string; hash: string }[] = [];

      // Find P and UL for the current H3
      let nextEl = el.next();
      while(nextEl.length > 0 && !nextEl.is('h2') && !nextEl.is('h3')) {
        if (nextEl.is('p') && !questionP) {
          questionP = nextEl;
          // Extract images from within P
          const pImgs = questionP.find('img');
          for (let k=0; k < pImgs.length; k++) {
            const imgSrc = $(pImgs[k]).attr('src');
            if (imgSrc) {
                const processedImg = await processImage(filePath, imgSrc, dryRun);
                if (processedImg) questionImagesInP.push(processedImg);
            }
          }
        } else if (nextEl.is('img') && questionP && !questionUl ) { // Image directly after P, before UL
            const imgSrc = nextEl.attr('src');
            if (imgSrc) {
                const processedImg = await processImage(filePath, imgSrc, dryRun);
                if (processedImg) questionImagesAfterP.push(processedImg);
            }
        } else if (nextEl.is('ul') && questionP && !questionUl) {
          questionUl = nextEl;
          break; // Found UL, stop searching for this question
        }
        nextEl = nextEl.next();
      }
      
      if (questionP && questionUl) {
        let finalQuestionContent = questionP.text().trim();
        const allQuestionImages = [...questionImagesInP, ...questionImagesAfterP];
        
        const contentNumberMatch = finalQuestionContent.match(/^(\d+)\.\s*/);
        if (contentNumberMatch && contentNumberMatch[1]) {
            const pTagNumber = parseInt(contentNumberMatch[1], 10);
            if (questionNumber !== undefined && questionNumber !== pTagNumber) {
                console.warn(`[DebugParse] Mismatch! Q# from H3: ${questionNumber}, Q# from P: ${pTagNumber}. Using H3's. Content: ${finalQuestionContent.substring(0,70)}`);
            } else if (questionNumber === undefined) {
                questionNumber = pTagNumber;
                console.log(`[DebugParse] Used Q# from P: ${questionNumber}, as H3 had no number. Original P content: "${finalQuestionContent.substring(0,70)}"`)
            }
            finalQuestionContent = finalQuestionContent.replace(/^(\d+)\.\s*/, '').trim();
        } else if (questionNumber !== undefined) {
            console.log(`[DebugParse] Q# ${questionNumber} from H3, but no leading number pattern in P: "${finalQuestionContent.substring(0,70)}"`)
        }

        const parsedOptions: ParsedOption[] = [];
        let answerIdx = -1;

        const liElements = questionUl.find('li');
        for (let optIdx = 0; optIdx < liElements.length; optIdx++) {
          const liElem = $(liElements[optIdx]);
          const isAnswer = liElem.find('b').length > 0 && liElem.find('b').text().includes('(정답)');
          if (isAnswer) {
            answerIdx = optIdx;
          }
          
          liElem.find('b').contents().unwrap();
          const optionText = liElem.text().replace(/\(정답\)/g, '').trim();
          
          const optionImagesProcessed: { url: string; hash: string }[] = [];
          const optImgs = liElem.find('img');
          for (let k=0; k < optImgs.length; k++) {
            const imgSrc = $(optImgs[k]).attr('src');
            if (imgSrc) {
              const processedImg = await processImage(filePath, imgSrc, dryRun);
              if (processedImg) optionImagesProcessed.push(processedImg);
            }
          }
          parsedOptions.push({ number: optIdx, text: optionText, images: optionImagesProcessed });
        }

        if (answerIdx === -1 && parsedOptions.length > 0) { // 선택지가 있는데 답이 없는 경우만 경고
          console.warn(`[ParseHtml] Answer not found for question (H3 text: ${h3Text}) in: ${filePath}. Subject: ${currentSubject}. Options count: ${parsedOptions.length}`);
        }

        console.log(`[DebugParse] Preparing to push question. Subject: ${currentSubject}, Q#: ${questionNumber}, Content (start): "${finalQuestionContent.replace(/\n/g, ' ').substring(0, 70)}..."`);
        questionsData.push({
          examName,
          examDate,
          subject: currentSubject,
          questionNumber: questionNumber || 0,
          questionContent: finalQuestionContent,
          options: parsedOptions,
          answerIndex: answerIdx,
          questionImages: allQuestionImages,
        });
      } else {
         console.warn(`[ParseHtml] Could not find P or UL for question (H3 text: ${h3Text}) in: ${filePath}. Subject: ${currentSubject}`);
      }
    } else if (el.is('ol')) {
      // ... existing code ...
    }
  }
  console.log(`[ParseHtml] Finished parsing ${filePath}. Found ${questionsData.length} questions.`);
  return questionsData;
}

// --- 메인 마이그레이션 함수 ---
export async function migrate(options: MigrateOptions = {}): Promise<void> {
  const {
    singleFile,
    targetExamName,
    runAll = false,
    dryRun = false,
    limit,
    resume = false,
    force = false,
    skipProcessed = true,
    retryFailed = false
  } = options;

  console.log('🚀 마이그레이션 시작');
  console.log(`📋 옵션: ${JSON.stringify({ singleFile, targetExamName, runAll, dryRun, limit, resume, force, skipProcessed, retryFailed })}`);

  try {
    // 진행상태 로드
    let progress = await loadProgress();
    
    // 새로운 마이그레이션 시작 시 초기화
    if (!resume) {
      progress = {
        totalFiles: 0,
        processedFiles: 0,
        successfulFiles: [],
        failedFiles: [],
        startTime: Date.now(),
        lastUpdated: Date.now(),
        performanceMetrics: {
          filesPerMinute: 0,
          averageProcessingTime: 0,
          totalProcessingTime: 0
        },
        databaseStats: { totalQuestions: 0, totalExams: 0 }
      };
    }

    // Bulk exam 상태 조회 (한 번만 실행)
    console.log('📊 DB에서 exam 상태를 bulk로 조회 중...');
    const examStatus = await getBulkExamStatus();
    console.log(`✅ ${examStatus.size}개 exam 상태 조회 완료`);

    // 파일 목록 생성
    const allHtmlFiles: string[] = [];
    
    if (singleFile) {
      const filePath = path.isAbsolute(singleFile) ? singleFile : path.join(PREDATA_DIR, singleFile);
      if (await fs.stat(filePath).then((s: any) => s.isFile()).catch(() => false)) {
        allHtmlFiles.push(filePath);
      } else {
        console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
        return;
      }
    } else if (targetExamName) {
      const dirToSearch = path.join(PREDATA_DIR, targetExamName);
      try {
        const stats = await fs.stat(dirToSearch);
        if (!stats.isDirectory()) {
          console.error(`❌ 디렉토리가 아닙니다: ${dirToSearch}`);
          return;
        }
        await findHtmlFiles(dirToSearch, allHtmlFiles, limit);
      } catch (error: any) {
        console.error(`❌ 디렉토리 접근 실패: ${dirToSearch}`, error);
        return;
      }
    } else if (runAll) {
      await findHtmlFiles(PREDATA_DIR, allHtmlFiles, limit);
    } else {
      console.error('❌ 마이그레이션 대상이 지정되지 않았습니다. --singleFile, --targetExamName, 또는 --run-all을 사용하세요.');
      return;
    }

    console.log(`📁 처리할 HTML 파일: ${allHtmlFiles.length}개`);
    
    // 진행상태 초기화
    if (!resume || force) {
      progress.totalFiles = allHtmlFiles.length;
      progress.processedFiles = 0;
      progress.successfulFiles = [];
      progress.failedFiles = [];
      progress.startTime = Date.now();
      progress.lastUpdated = Date.now();
      progress.performanceMetrics = {
        filesPerMinute: 0,
        averageProcessingTime: 0,
        totalProcessingTime: 0
      };
      await saveProgress(progress);
    }

    let processedFileCount = 0;

    // 파일 처리 로직
    for (const filePath of allHtmlFiles) {
      try {
        // Bulk 스킵 체크 (기존 개별 체크 대신)
        if (skipProcessed && await shouldSkipFile(filePath, examStatus)) {
          progress.processedFiles++;
          processedFileCount++;
          console.log(`⏭️  스킵된 파일: ${path.basename(filePath)}`);
          continue; // 다음 파일로
        }

        // resume 모드에서 이미 성공한 파일 스킵
        if (resume && !force && progress.successfulFiles.includes(filePath)) {
          console.log(`⏭️  이미 처리된 파일 스킵 (progress): ${path.basename(filePath)}`);
          progress.processedFiles++;
          processedFileCount++;
          continue;
        }

        // 현재 처리 중인 파일 표시
        progress.currentFile = filePath;
        await saveProgress(progress);

        console.log(`\n📝 파일 처리 중 (${processedFileCount + 1}/${allHtmlFiles.length}): ${path.basename(filePath)}`);
        
        try {
          const parsedQuestions = await parseHtmlFile(filePath, dryRun);

          if (parsedQuestions.length === 0) {
            console.log(`⚠️  파싱된 문제가 없습니다: ${path.basename(filePath)}`);
            await updateProgress(progress, filePath, true, allHtmlFiles.length);
            await saveProgress(progress);
            processedFileCount++;
            continue;
          }

          if (dryRun) {
            console.log(`🔍 (Dry Run) ${parsedQuestions.length}개 문제 파싱됨: ${path.basename(filePath)}`);
            await updateProgress(progress, filePath, true, allHtmlFiles.length);
            await saveProgress(progress);
          } else {
            // 실제 DB 작업
            try {
              await db.transaction(async (tx: any) => {
                // 먼저 exam 정보 확인/생성
                const firstQuestion = parsedQuestions[0];
                let examRecord = await tx.select({ id: exams.id })
                  .from(exams)
                  .where(and(
                    eq(exams.name, firstQuestion.examName),
                    eq(exams.date, firstQuestion.examDate),
                    eq(exams.subject, firstQuestion.subject)
                  ))
                  .limit(1)
                  .then((rows: { id: string }[]) => rows[0]);

                let currentExamId: string;
                if (!examRecord) {
                  const newExam = await tx.insert(exams)
                    .values({
                      name: firstQuestion.examName,
                      date: firstQuestion.examDate,
                      subject: firstQuestion.subject,
                    })
                    .returning({ id: exams.id })
                    .then((rows: { id: string }[]) => rows[0]);
                  currentExamId = newExam.id;
                  console.log(`📝 새 시험 등록: ${firstQuestion.examName}-${firstQuestion.examDate}-${firstQuestion.subject} (ID: ${currentExamId})`);
                } else {
                  currentExamId = examRecord.id;
                }

                // Bulk 중복 체크
                const existingQuestions = await bulkCheckExistingQuestions(parsedQuestions, currentExamId);
                const questionsToInsert = parsedQuestions.filter(q => !existingQuestions.has(q.questionContent));
                
                if (questionsToInsert.length === 0) {
                  console.log(`⏭️  모든 문제가 이미 존재함: ${path.basename(filePath)}`);
                  return;
                }

                console.log(`📊 ${parsedQuestions.length}개 중 ${questionsToInsert.length}개 새 문제 추가`);

                // 필터링된 문제들만 처리
                for (const q of questionsToInsert) {
                  if (q.answerIndex === -1 && q.options.length > 0) {
                    console.warn(`⚠️  선택지가 있지만 답이 없는 문제 스킵: ${q.questionContent.substring(0,50)}...`);
                    continue;
                  }

                  try {
                    const newQuestion = await tx.insert(questions).values({
                      examId: currentExamId,
                      content: q.questionContent,
                      questionNumber: q.questionNumber,
                      options: q.options.map(opt => ({ 
                        number: opt.number, 
                        text: opt.text, 
                        images: opt.images
                      })),
                      answer: q.answerIndex,
                      explanation: null,
                      images: q.questionImages,
                      explanationImages: [],
                      userId: 'system-migration',
                    }).returning({ id: questions.id });
                    console.log(`✅ 문제 저장 완료: ${q.questionContent.substring(0, 50)}...`);
                  } catch (dbError) {
                    console.error(`❌ 문제 저장 실패: ${q.questionContent.substring(0,50)}...`, dbError);
                  }
                }
              });
              
              // 성공적으로 처리됨
              await updateProgress(progress, filePath, true, allHtmlFiles.length);
              await saveProgress(progress);
              console.log(`✅ 파일 처리 완료: ${path.basename(filePath)}`);
              
            } catch (error) {
              console.error(`❌ 파일 처리 실패: ${path.basename(filePath)}`, error);
              await updateProgress(progress, filePath, false, allHtmlFiles.length);
              await saveProgress(progress);
            }
          }
        } catch (error) {
          console.error(`❌ 파일 파싱 실패: ${path.basename(filePath)}`, error);
          
          // 에러 로깅
          await logError(filePath, error, `파싱 실패: ${new Date().toISOString()}`);
          
          // 실패한 파일 처리
          await updateProgress(progress, filePath, false, allHtmlFiles.length);
          await saveProgress(progress);
          
          // 에러 발생 시 잠시 대기 (데이터베이스 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        processedFileCount++;
        
        // 진행상황 표시 (10개 파일마다 또는 마지막 파일)
        if (processedFileCount % 10 === 0 || processedFileCount === allHtmlFiles.length) {
          displayProgress(progress);
          // 배치로 진행상태 저장 (매번 저장하지 않음)
          if (processedFileCount % 10 === 0) {
            await saveProgress(progress);
          }
        }
              } catch (error) {
          console.error(`❌ 파일 처리 중 오류 발생: ${path.basename(filePath)}`, error);
          await updateProgress(progress, filePath, false, allHtmlFiles.length);
          
          // 에러 로깅
          await logError(filePath, error, `파일 처리 실패: ${new Date().toISOString()}`);
          
          // 에러 발생 시 잠시 대기 (데이터베이스 부하 방지)
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // 최종 진행상황 표시
    displayProgress(progress);
    console.log(`\n🎉 마이그레이션 완료! ${processedFileCount}개 파일 처리됨`);
    
    if (progress.failedFiles.length > 0) {
      console.log(`\n⚠️  실패한 파일이 있습니다. 다음 명령으로 재처리할 수 있습니다:`);
      console.log(`   npx tsx scripts/migratePredata.ts --resume --targetExamName=${targetExamName || 'ALL'}`);
    }
  } catch (error) {
    console.error("\n❌ 마이그레이션 실행 중 오류 발생:", error);
    process.exit(1);
  }
}

// HTML 파일 찾기 함수
async function findHtmlFiles(dir: string, allHtmlFiles: string[], limit?: number): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (limit && allHtmlFiles.length >= limit) break;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findHtmlFiles(fullPath, allHtmlFiles, limit);
    } else if (entry.isFile() && (entry.name.endsWith('_result.html') || entry.name.endsWith('_results.html'))) {
      allHtmlFiles.push(fullPath);
    }
  }
}

// --- 스크립트 실행 부분 ---
async function main() {
  const args = process.argv.slice(2);
  const options: MigrateOptions = {};
  
  if (args.includes('--dry-run')) {
    options.dryRun = true;
  }
  
  if (args.includes('--resume')) {
    options.resume = true;
  }
  
  if (args.includes('--force')) {
    options.force = true;
  }

  if (args.includes('--skip-processed')) {
    options.skipProcessed = true;
  }

  if (args.includes('--retry-failed')) {
    options.retryFailed = true;
  }

  // --singleFile 인자 처리 수정
  const singleFileArg = args.find(arg => arg.startsWith('--singleFile='));
  if (singleFileArg) {
    options.singleFile = singleFileArg.split('=')[1];
    if (!options.singleFile) { // --singleFile= 다음에 값이 없는 경우
        console.warn("[ArgsParse] --singleFile option used with '=' but no value provided. Ignoring.");
        options.singleFile = undefined; // 확실히 undefined로 설정
    }
  } else {
    const singleFileArgIndex = args.indexOf('--singleFile');
    if (singleFileArgIndex !== -1 && args[singleFileArgIndex + 1]) {
      // 다음 인자가 다른 옵션이 아닌지 확인 (간단한 체크)
      const nextArg = args[singleFileArgIndex + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        options.singleFile = nextArg;
      } else {
        console.warn(`[ArgsParse] --singleFile option used but next argument '${nextArg}' looks like another option. Ignoring --singleFile value.`);
      }
    }
  }

  // --limit 인자 처리 (--limit=value 형태)
  const limitArg = args.find((arg: string) => arg.startsWith('--limit='));
  if (limitArg) {
    const limitValue = limitArg.split('=')[1];
    if (limitValue) {
      options.limit = parseInt(limitValue, 10);
    }
  }
  
  // --targetExamName 인자 처리 (--targetExamName=value 형태)
  const targetExamNameArg = args.find((arg: string) => arg.startsWith('--targetExamName='));
  if (targetExamNameArg) {
    const examNameValue = targetExamNameArg.split('=')[1];
    if (examNameValue) {
      options.targetExamName = examNameValue;
    }
  }

  // --run-all 인자 처리
  if (args.includes('--run-all')) {
    options.runAll = true;
  }

  // --parse-only 인자 처리
  if (args.includes('--parse-only')) {
    options.dryRun = true; // parse-only는 dryRun과 동일한 효과
  }

  // 실행 모드 유효성 검사: singleFile 또는 targetExamName 중 하나는 지정되어야 함
  if (!options.singleFile && !options.targetExamName && !options.runAll && !(options.singleFile && args.includes('--parse-only'))) {
    console.error("Error: No target specified for migration. You must use either --singleFile, --targetExamName, or --run-all.");
    console.log("\nUsage examples:");
    console.log("  npx tsx scripts/migratePredata.ts --singleFile=path/to/your/file.html");
    console.log("  npx tsx scripts/migratePredata.ts --targetExamName=건설안전기사");
    console.log("  npx tsx scripts/migratePredata.ts --run-all");    
    console.log("  npx tsx scripts/migratePredata.ts --parse-only --singleFile=path/to/your/file.html");
    console.log("  npx tsx scripts/migratePredata.ts --resume --targetExamName=건설안전기사"); // 중단된 지점부터 재개
    console.log("  npx tsx scripts/migratePredata.ts --force --targetExamName=건설안전기사"); // 강제 재처리
    console.log("\nOptional flags:");
    console.log("  --dry-run          Simulate migration without writing to DB or files.");
    console.log("  --limit=<number>   Limit the number of files processed.");
    console.log("  --resume           Resume from previous migration point.");
    console.log("  --force            Force reprocessing of all files.");
    console.log("  --skip-processed   Skip files that have already been processed in the database.");
    console.log("  --retry-failed     Retry failed files.");
    process.exit(1);
  }

  // PostgreSQL 연결 전으로 DB 연결 로직 이동 고려 (현재는 main 함수 후반부에 위치)
  // 실제 마이그레이션 로직 실행 분기
  if (options.singleFile && args.includes('--parse-only')) {
    console.log(`Running in PARSE ONLY mode for: ${options.singleFile}`);
    const fullPathToParse = path.isAbsolute(options.singleFile)
                              ? options.singleFile
                              : path.join(PREDATA_DIR, options.singleFile);
    // DB 연결이 필요 없는 작업이므로, 여기서 바로 실행하고 종료 가능
    parseHtmlFile(fullPathToParse, true).then(parsed => {
      console.log("\n--- Parsed Data ---");
      console.log(JSON.stringify(parsed, null, 2));
      console.log("--- End of Parsed Data ---");
      process.exit(0);
    }).catch(err => {
      console.error("Error during parse-only mode:", err);
      process.exit(1);
    });
    return; // parse-only 모드는 여기서 실행 후 종료
  }
  
  // --- 이하 모드들은 DB 연결이 필요함 ---
  // PostgreSQL 연결 시도 로직 (최대 10번)
  let connected = false;
  for (let i = 1; i <= 10; i++) {
    try {
      console.log(`PostgreSQL 연결 시도 중... (시도: ${i}/10)`);
      await db.execute(sql`SELECT 1`); 
      console.log("PostgreSQL 연결 성공!");
      connected = true;
      break;
    } catch (error) {
      console.error("PostgreSQL 연결 실패:", error);
      if (i < 10) {
        console.log("5초 후 재시도...");
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error("최대 재시도 횟수 초과. PostgreSQL 서버가 실행 중인지, DATABASE_URL이 올바른지 확인하세요.");
        process.exit(1); // DB 연결 실패 시 종료
      }
    }
  }
  if (!connected) return; // 사실상 위에서 exit하므로 도달하기 어려움

  // 실제 마이그레이션 작업 수행
  try {
    if (options.singleFile) { // --parse-only 없는 --singleFile
      console.log(`Running in SINGLE FILE migration mode for: ${options.singleFile}`);
      await migrate(options);
    } else if (options.targetExamName) { // --targetExamName (단독 또는 --run-all과 함께 올 수 있으나, 여기서 단독 처리)
      console.log(`Running migration for target exam directory: ${options.targetExamName}`);
      await migrate(options);
    } else if (options.runAll) { // --run-all 만 있고, targetExamName은 없는 경우 (PREDATA_DIR 전체)
      console.log('Running in FULL migration mode for all files in PREDATA_DIR.');
      await migrate(options);
    } else {
      // 이 부분은 상단의 유효성 검사로 인해 도달하지 않아야 함.
      // 혹시 도달한다면 로직 오류이므로 에러 처리.
      console.error("Internal Error: Invalid execution path in main function. No recognized migration mode.");
      process.exit(1);
    }
    // 성공 메시지는 main().then()으로 이동
  } catch (error) {
    console.error("\nError during migration execution:", error);
    process.exit(1); // 마이그레이션 함수 자체에서 오류 발생 시
  }
}

// main 함수 실행 및 종료 처리
main().then(() => {
  console.log("\nMigration script operations completed. Exiting...");
  process.exit(0);
}).catch(error => {
  // main 함수 내부에서 이미 console.error 및 process.exit(1)을 호출하므로,
  // 여기서의 catch는 예기치 않은 최상위 수준의 오류를 잡기 위함 (예: main 함수 자체의 동기적 오류 등)
  // 하지만 대부분의 오류는 main 내부에서 처리될 것임.
  console.error("Unhandled error in migration script execution:", error);
  process.exit(1);
}); 