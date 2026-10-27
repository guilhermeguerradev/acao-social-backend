-- Nullable fields preserve legacy records without fabricating contact data or consent.
CREATE TYPE "DemandCategory" AS ENUM ('FOOD', 'CLOTHING', 'HYGIENE', 'HEALTH', 'EDUCATION', 'SOCIAL_ASSISTANCE', 'OTHER');
CREATE TYPE "DemandReturnPreference" AS ENUM ('WHATSAPP', 'PHONE_CALL');

ALTER TABLE "Demand"
    ADD COLUMN "phone" VARCHAR(11),
    ADD COLUMN "neighborhood" VARCHAR(120),
    ADD COLUMN "returnPreference" "DemandReturnPreference",
    ADD COLUMN "category" "DemandCategory",
    ADD COLUMN "otherDescription" VARCHAR(200),
    ADD COLUMN "urgent" BOOLEAN,
    ADD COLUMN "contactConsentAt" TIMESTAMP(3),
    ADD COLUMN "contactConsentVersion" TEXT,
    ADD COLUMN "contactConsentText" TEXT;
