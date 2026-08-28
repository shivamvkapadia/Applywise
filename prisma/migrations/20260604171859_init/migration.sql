-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "resumeText" TEXT NOT NULL DEFAULT '',
    "resumeFileName" TEXT,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "links" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT,
    "descriptionText" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'WISHLIST',
    "order" REAL NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Kit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "coverLetter" TEXT NOT NULL DEFAULT '',
    "resumeBullets" TEXT NOT NULL DEFAULT '',
    "interviewQuestions" TEXT NOT NULL DEFAULT '',
    "companyBrief" TEXT NOT NULL DEFAULT '',
    "modelUsed" TEXT NOT NULL DEFAULT '',
    "generatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kit_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "openRouterApiKey" TEXT NOT NULL DEFAULT '',
    "model" TEXT NOT NULL DEFAULT 'anthropic/claude-sonnet-4.5',
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Kit_jobId_key" ON "Kit"("jobId");
