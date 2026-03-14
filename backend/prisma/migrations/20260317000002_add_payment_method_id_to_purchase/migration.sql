-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "paymentMethodId" TEXT;

-- CreateIndex
CREATE INDEX "Purchase_paymentMethodId_idx" ON "Purchase"("paymentMethodId");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
