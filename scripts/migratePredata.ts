import fs from 'fs/promises';
import path from 'path';
import { db } from '@/db'; // 데이터베이스 인스턴스
import { exams, questions, images as imagesSchema } from '@/db/schema'; // Drizzle 스키마
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';
import * as cheerio from 'cheerio'; // HTML 파싱용 (네임스페이스 임포트)
// import { Element } from 'cheerio'; // 이전 시도

const PREDATA_DIR = path.join(process.cwd(), 'predata');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'uploaded');

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
  dryRun?: boolean;
  singleFile?: string; // 테스트할 단일 HTML 파일 경로 (PREDATA_DIR 기준 상대 경로 또는 절대 경로)
  limit?: number; // 처리할 총 파일 수 제한 (테스트용)
  targetExamName?: string; // 특정 시험명 폴더를 대상으로 지정
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

    if (existingImages.length > 0) {
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
          questionNumber,
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
async function migrate(options: MigrateOptions = {}) {
  const { dryRun = false, singleFile, limit, targetExamName } = options;
  console.log(`Starting Predata migration... ${dryRun ? '(Dry Run)' : ''}`);
  if (singleFile) {
    console.log(`Targeting single file: ${singleFile}`);
  } else if (targetExamName) {
    console.log(`Targeting exam name directory: ${targetExamName}`);
  }
  if (limit) console.log(`Limiting to ${limit} files.`);

  const allHtmlFiles: string[] = [];

  // findHtmlFiles 함수를 migrate 함수 내부로 이동시켜 allHtmlFiles에 직접 접근하도록 함
  async function findHtmlFiles(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (limit && allHtmlFiles.length >= limit) break; // 파일 수 제한
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await findHtmlFiles(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('_result.html') || entry.name.endsWith('_results.html'))) {
        allHtmlFiles.push(fullPath);
      }
    }
  }

  if (singleFile) {
    // 절대 경로 또는 PREDATA_DIR 기준 상대 경로일 수 있음
    const filePath = path.isAbsolute(singleFile) ? singleFile : path.join(PREDATA_DIR, singleFile);
    if (await fs.stat(filePath).then(s => s.isFile()).catch(() => false)) {
      allHtmlFiles.push(filePath);
    } else {
      console.error(`[Migrate] Single file not found or is not a file: ${filePath}`);
      return;
    }
  } else {
    let dirToSearch = PREDATA_DIR;
    if (targetExamName) {
      dirToSearch = path.join(PREDATA_DIR, targetExamName);
      try {
        const stats = await fs.stat(dirToSearch);
        if (!stats.isDirectory()) {
          console.error(`[Migrate] Error: Target directory ${dirToSearch} for exam ${targetExamName} is not a valid directory.`);
          return;
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          console.error(`[Migrate] Error: Target directory ${dirToSearch} for exam ${targetExamName} does not exist.`);
        } else {
          console.error(`[Migrate] Error: Could not access target directory ${dirToSearch} for exam ${targetExamName}.`, error);
        }
        return;
      }
    }
    console.log(`[Migrate] Searching for HTML files in: ${dirToSearch}`);
    await findHtmlFiles(dirToSearch);
  }
  
  console.log(`Found ${allHtmlFiles.length} HTML file(s) to process.`);
  let processedFileCount = 0;

  for (const htmlFilePath of allHtmlFiles) {
    if (limit && processedFileCount >= limit) {
        console.log(`[Migrate] Reached file limit of ${limit}. Stopping.`);
        break;
    }
    console.log(`\nProcessing file (${processedFileCount + 1}/${allHtmlFiles.length}): ${htmlFilePath}`);
    const parsedQuestions = await parseHtmlFile(htmlFilePath, dryRun);

    if (parsedQuestions.length === 0) {
      console.log(`No questions parsed from ${htmlFilePath}. Skipping.`);
      processedFileCount++;
      continue;
    }

    if (dryRun) {
      console.log(`[Migrate] (Dry Run) Would process ${parsedQuestions.length} questions from ${htmlFilePath}`);
      parsedQuestions.forEach((q, idx) => {
        console.log(`  [Dry Run] Question ${idx + 1}: ${q.questionContent.substring(0, 70)}...`);
        console.log(`    Exam: ${q.examName}, Date: ${q.examDate}, Subject: ${q.subject}`);
        console.log(`    Options: ${q.options.length}, Answer Index: ${q.answerIndex}`);
        q.questionImages.forEach(img => console.log(`    Q_Image: ${img.url} (hash: ${img.hash})`));
        q.options.forEach(opt => opt.images.forEach(img => console.log(`    Opt_Image (${opt.number}): ${img.url} (hash: ${img.hash})`)));
         if (q.answerIndex === -1 && q.options.length > 0) {
            console.warn(`    [Dry Run] WARN: Question has options but no answer index!`);
        }
      });
    } else {
      // 실제 DB 작업
      await db.transaction(async (tx: any) => {
        for (const q of parsedQuestions) {
          if (q.answerIndex === -1 && q.options.length > 0) { // 선택지가 있는데 답이 없는 경우
            console.warn(`[DB Insert] Skipping question with options but no answer: ${q.questionContent.substring(0,50)}... in ${htmlFilePath}`);
            continue;
          }
          if (q.options.length === 0 && q.answerIndex === -1) { // 선택지가 아예 없는 문제 (간혹 Predata에 있음)
             // 이런 문제는 저장할 수도, 건너뛸 수도 있음. 일단 저장 시도.
             console.log(`[DB Insert] Attempting to save question with no options: ${q.questionContent.substring(0,50)}...`);
          }


          let examRecord = await tx.select({ id: exams.id })
            .from(exams)
            .where(and(
              eq(exams.name, q.examName),
              eq(exams.date, q.examDate),
              eq(exams.subject, q.subject)
            ))
            .limit(1)
            .then((rows: { id: string }[]) => rows[0]);

          let currentExamId: string;
          if (!examRecord) {
            const newExam = await tx.insert(exams)
              .values({
                name: q.examName,
                date: q.examDate,
                subject: q.subject,
              })
              .returning({ id: exams.id })
              .then((rows: { id: string }[]) => rows[0]);
            currentExamId = newExam.id;
            console.log(`[DB Insert] New exam: ${q.examName}-${q.examDate}-${q.subject} (ID: ${currentExamId})`);
          } else {
            currentExamId = examRecord.id;
          }

          try {
            // 중복 문제 방지: examId와 content가 같은 문제가 이미 있는지 확인
            const existingQuestion = await tx.select({id: questions.id})
                .from(questions)
                .where(and(
                    eq(questions.examId, currentExamId),
                    eq(questions.content, q.questionContent) 
                ))
                .limit(1)
                .then((rows: { id: string }[]) => rows[0]);

            if (existingQuestion) {
                console.log(`[DB Insert] Question already exists (ExamID: ${currentExamId}, Content: "${q.questionContent.substring(0,30)}..."). Skipping.`);
                continue;
            }
            
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
            console.log(`[DB Insert] Question inserted for exam ID ${currentExamId}: ${q.questionContent.substring(0, 50)}...`);
          } catch (dbError) {
            console.error(`[DB Insert] Error inserting question (ExamID: ${currentExamId}, Content: "${q.questionContent.substring(0,50)}..."):`, dbError);
          }
        }
      });
    }
    processedFileCount++;
  }
  console.log(`\nPredata migration finished. Processed ${processedFileCount} file(s).`);
}

// --- 스크립트 실행 부분 ---
async function main() {
  const args = process.argv.slice(2);
  const options: MigrateOptions = {};
  if (args.includes('--dry-run')) {
    options.dryRun = true;
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
      if (!args[singleFileArgIndex + 1].startsWith('--')) {
        options.singleFile = args[singleFileArgIndex + 1];
      } else {
        console.warn(`[ArgsParse] --singleFile option used but next argument '${args[singleFileArgIndex + 1]}' looks like another option. Ignoring --singleFile value.`);
      }
    }
  }

  const limitArgIndex = args.indexOf('--limit');
  if (limitArgIndex !== -1 && args[limitArgIndex + 1]) {
    options.limit = parseInt(args[limitArgIndex + 1], 10);
  }
  const targetExamNameArgIndex = args.indexOf('--targetExamName');
  if (targetExamNameArgIndex !== -1 && args[targetExamNameArgIndex + 1]) {
    options.targetExamName = args[targetExamNameArgIndex + 1];
  }

  // 실행 모드 유효성 검사: singleFile 또는 targetExamName 중 하나는 지정되어야 함
  if (!options.singleFile && !options.targetExamName && !args.includes('--run-all') && !(options.singleFile && args.includes('--parse-only'))) {
    console.error("Error: No target specified for migration. You must use either --singleFile, --targetExamName, or --run-all.");
    console.log("\nUsage examples:");
    console.log("  npx tsx scripts/migratePredata.ts --singleFile=path/to/your/file.html");
    console.log("  npx tsx scripts/migratePredata.ts --targetExamName=건설안전기사");
    console.log("  npx tsx scripts/migratePredata.ts --run-all");    
    console.log("  npx tsx scripts/migratePredata.ts --parse-only --singleFile=path/to/your/file.html");
    console.log("\nOptional flags:");
    console.log("  --dry-run          Simulate migration without writing to DB or files.");
    console.log("  --limit=<number>   Limit the number of files processed.");
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
    } else if (args.includes('--run-all')) { // --run-all 만 있고, targetExamName은 없는 경우 (PREDATA_DIR 전체)
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