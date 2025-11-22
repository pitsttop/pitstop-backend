-- DropForeignKey
ALTER TABLE "public"."PartUsage" DROP CONSTRAINT "PartUsage_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceUsage" DROP CONSTRAINT "ServiceUsage_orderId_fkey";

-- AddForeignKey
ALTER TABLE "PartUsage" ADD CONSTRAINT "PartUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceUsage" ADD CONSTRAINT "ServiceUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
