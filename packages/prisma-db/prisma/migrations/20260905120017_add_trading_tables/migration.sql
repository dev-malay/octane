-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('MARKET', 'LIMIT');

-- CreateEnum
CREATE TYPE "PositionType" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('OPEN', 'CLOSE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'FILLED', 'PARTIALLY_FILLED', 'CANCEL', 'REJECTED');

-- CreateTable
CREATE TABLE "Fills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "makerId" TEXT NOT NULL,
    "takerId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "originalQty" DOUBLE PRECISION NOT NULL,
    "filledQty" DOUBLE PRECISION NOT NULL,
    "remainingQty" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fills_pkey" PRIMARY KEY ("id","createdAt")
);

-- CreateTable
CREATE TABLE "Orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "qty" DOUBLE PRECISION NOT NULL,
    "remainingQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leverage" INTEGER NOT NULL,
    "margin" DOUBLE PRECISION,
    "marketId" TEXT NOT NULL,
    "positionType" "PositionType" NOT NULL,
    "orderType" "OrderType" NOT NULL,
    "orderStatus" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Positions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "positionType" "PositionType" NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "leverage" INTEGER NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "maintainanceMargin" DOUBLE PRECISION NOT NULL,
    "liquidationPrice" DOUBLE PRECISION NOT NULL,
    "realisedPnL" DOUBLE PRECISION NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "averagePrice" DOUBLE PRECISION NOT NULL,
    "unrealisedPnL" DOUBLE PRECISION NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3) NOT NULL,
    "status" "PositionStatus" NOT NULL,

    CONSTRAINT "Positions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fills" ADD CONSTRAINT "Fills_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Positions" ADD CONSTRAINT "Positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Positions" ADD CONSTRAINT "Positions_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
