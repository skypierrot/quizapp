.
├── Dockerfile
├── Dockerfile.dev
├── FILE_STRUCTURE.md
├── PasteForm.tsx
├── README-DEV.md
├── README.md
├── app
│   ├── admin
│   │   ├── images
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api
│   │   ├── admin
│   │   ├── exam-instances
│   │   ├── exam-results
│   │   ├── images
│   │   ├── questions
│   │   └── upload
│   ├── bank
│   │   ├── [examName]
│   │   └── page.tsx
│   ├── community
│   │   ├── forum
│   │   └── notice
│   ├── contact
│   │   └── page.tsx
│   ├── dev-mode.ts
│   ├── exam
│   │   ├── [examName]
│   │   └── page.tsx
│   ├── exams
│   │   ├── [id]
│   │   └── page.tsx
│   ├── faq
│   │   └── page.tsx
│   ├── globals.css
│   ├── guide
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── practice
│   │   └── page.tsx
│   ├── privacy
│   │   └── page.tsx
│   ├── questions
│   │   ├── edit
│   │   ├── list
│   │   ├── new
│   │   └── review
│   ├── results
│   │   └── [resultId]
│   ├── sign-in
│   │   └── [[...sign-in]]
│   ├── sign-up
│   │   └── [[...sign-up]]
│   ├── solve
│   │   └── [examName]
│   ├── statistics
│   │   └── page.tsx
│   ├── study
│   │   └── [examName]
│   ├── terms
│   │   └── page.tsx
│   └── wrong-answers
│       └── page.tsx
├── clerk.config.json
├── components
│   ├── common
│   │   └── Breadcrumb.tsx
│   ├── layout
│   │   ├── Footer.tsx
│   │   └── Navbar.tsx
│   ├── question
│   │   ├── ManualForm
│   │   ├── ManualForm-new.tsx
│   │   ├── ManualForm-old.tsx
│   │   ├── ManualForm.tsx
│   │   ├── PasteForm
│   │   ├── PasteForm.tsx
│   │   ├── PasteInput.tsx
│   │   ├── QuestionDetail.tsx
│   │   ├── QuestionForm.tsx
│   │   ├── RadioOptions.tsx
│   │   ├── ResolvedQuestions.tsx
│   │   └── review
│   ├── solve
│   ├── study
│   │   └── StudyPageHeader.tsx
│   └── ui
│       ├── accordion.tsx
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── loading-spinner.tsx
│       ├── navigation-menu.tsx
│       ├── radio-group.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── skeleton.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── use-toast.ts
├── components.json
├── db
│   ├── index.ts
│   ├── migrations
│   │   ├── 0000_blue_war_machine.sql
│   │   └── meta
│   ├── schema
│   │   ├── examResults.ts
│   │   ├── images.ts
│   │   ├── index.ts
│   │   └── questions.ts
│   └── schema-images.ts
├── dev.sh
├── docker-compose.dev.yml
├── docker-compose.yml
├── docs
│   ├── 개발규칙(최우선).md
│   ├── 개발일지
│   │   └── 개발일지.md
│   ├── 개발제안서.md
│   ├── 단계별 구현 전략.md
│   └── 파일별코드현황.md
├── drizzle
│   ├── 0000_short_bushwacker.sql
│   ├── 0001_puzzling_chronomancer.sql
│   ├── 0002_complete_piledriver.sql
│   ├── 0002_last_ted_forrester.sql.bak
│   ├── 0003_familiar_plazm.sql
│   └── meta
│       ├── 0000_snapshot.json
│       ├── 0001_snapshot.json
│       ├── 0002_snapshot.json
│       ├── 0003_snapshot.json
│       └── _journal.json
├── drizzle.config.images.ts
├── drizzle.config.ts
├── hooks
│   ├── question
│   │   ├── useManualFormImage.ts
│   │   ├── useManualFormOption.ts
│   │   ├── useManualFormTag.ts
│   │   ├── usePasteFormImage.ts
│   │   └── usePasteFormQuestions.ts
│   └── useTagManagement.ts
├── lib
│   ├── db.ts
│   ├── fonts.ts
│   └── utils.ts
├── middleware.ts
├── next-env.d.ts
├── next.config.mjs
├── nginx-config.conf
├── otherproject
├── package-lock.json
├── package.json
├── postcss.config.js
├── public
│   └── images
│       ├── tmp
│       └── uploaded
├── scripts
│   ├── cleanOrphanedImages.ts
│   └── cleanup-tmp-images.ts
├── setup-images.sql
├── setup-tables-update.sql
├── setup-tables.sql
├── store
├── tailwind.config.js
├── tsconfig.json
├── types
│   ├── index.ts
│   ├── question.ts
│   └── toast.ts
├── update-user-id-type.sql
└── utils
    ├── cn.ts
    ├── image.ts
    ├── normalizeUrl.ts
    └── questionParser.ts

73 directories, 119 files
