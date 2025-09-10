-- CreateTable
CREATE TABLE "public"."SampleRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "contactNo" TEXT,
    "city" TEXT,
    "schoolName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SampleRequest_pkey" PRIMARY KEY ("id")
);
