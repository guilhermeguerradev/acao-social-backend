CREATE TYPE "DemandStatus" AS ENUM ('RECEIVED');

CREATE TABLE "Demand" (
    "id" TEXT NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "status" "DemandStatus" NOT NULL DEFAULT 'RECEIVED',
    "requesterId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Demand_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Demand_requesterId_requestKey_key" ON "Demand"("requesterId", "requestKey");
CREATE INDEX "Demand_requesterId_createdAt_id_idx" ON "Demand"("requesterId", "createdAt", "id");
CREATE INDEX "Demand_createdAt_id_idx" ON "Demand"("createdAt", "id");

ALTER TABLE "Demand" ADD CONSTRAINT "Demand_requesterId_fkey"
    FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
