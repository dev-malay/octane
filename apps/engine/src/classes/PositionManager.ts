import type { UserPositions } from "shared-types";
import type { UserManager } from "./UserManager";
import type { RedisManager } from "./RedisManager";
import type { RiskManager } from "./RiskManager";

export class PositionManager {
  public allPositions: Map<string, UserPositions[]>;
  
  constructor(
    private userManager: UserManager,
    private redisManager: RedisManager,
    private riskManager: RiskManager,
  ) {
    this.allPositions = new Map();
  }

  setDBPoller(dbpoller: any) { }

  getPosition(userId: string, marketId: string) {
    const positions = this.userManager.getPositiotns(userId);
    if (!positions) return null;
    for (let p of positions) if (p.marketId === marketId) return p;
    return null;
  }

  manipulatePositions(
    incommingPosition: UserPositions,
    existingPosition: UserPositions,
    userId: string,
  ) {
    let finalPosition: UserPositions | null = null;
    let isCancel = false;
    if (incommingPosition.positionType === existingPosition.positionType) {
      finalPosition = this.addPosition(incommingPosition, existingPosition);
    } else {
      if (incommingPosition.qty > existingPosition.qty)
        finalPosition = this.reversePosition(
          incommingPosition,
          existingPosition,
          userId,
        );
      else if (incommingPosition.qty < existingPosition.qty)
        finalPosition = this.reducePosition(
          incommingPosition,
          existingPosition,
          userId,
        );
      else {
        finalPosition = this.cancelPosition(
          incommingPosition,
          existingPosition,
          userId,
        );
        isCancel = true;
      }
    }
    if (!finalPosition) throw new Error("no final position");
    this.publishPositionUpdate(userId, finalPosition);
  }
  newPosition(userId: string, position: UserPositions) {
    const user = this.userManager.getUser(userId);
    if (!user) throw new Error("user does not exist to add position");
    user.positions.push(position);
    this.publishPositionUpdate(userId, position);
  }
  addPosition(position: UserPositions, existingPosition: UserPositions) {
    const currentLiquidity =
      existingPosition.averagePrice * existingPosition.qty;
    const incommingLiquidity = position.averagePrice * position.qty;
    const totalQty = existingPosition.qty + position.qty;
    const totalAvgPrice = (currentLiquidity + incommingLiquidity) / totalQty;

    existingPosition.qty += position.qty;
    existingPosition.averagePrice = totalAvgPrice;
    existingPosition.margin += position.margin;
    existingPosition.maintainanceMargin =
      this.riskManager.calculateMaintainanceMargin(existingPosition.margin);
    existingPosition.liquidationPrice =
      this.riskManager.calculateLiquidationMargin(
        existingPosition.averagePrice,
        existingPosition.leverage,
        existingPosition.positionType,
      );
    return existingPosition;
  }
  reducePosition(
    position: UserPositions,
    existingPosition: UserPositions,
    userId: string,
  ): UserPositions {
    let pnl: number;
    if (existingPosition.positionType === "LONG")
      pnl =
        position.qty * (position.averagePrice - existingPosition.averagePrice);
    else
      pnl =
        position.qty * (existingPosition.averagePrice - position.averagePrice);
    const user = this.userManager.getUser(userId);
    if (!user) throw new Error("user not found in reduce Position");
    const existingQty = existingPosition.qty;
    const unlockMargin = existingPosition.margin * (position.qty / existingQty);
    existingPosition.qty -= position.qty;
    existingPosition.pnL = pnl;
    existingPosition.realisedPnL += pnl;
    existingPosition.margin -= unlockMargin;
    user.collateral.availabe += pnl + unlockMargin;
    user.collateral.locked -= unlockMargin;
    return existingPosition;
  }
  cancelPosition(
    position: UserPositions,
    existingPosition: UserPositions,
    userId: string,
  ): UserPositions {
    let PnL = 0;
    if (existingPosition.positionType === "LONG")
      PnL = (position.averagePrice - existingPosition.averagePrice) * position.qty;
    else
      PnL = (existingPosition.averagePrice - position.averagePrice) * position.qty;
    const user = this.userManager.getUser(userId);

    if (!user) throw new Error("user not found in cancelPosition");
    existingPosition.realisedPnL += PnL;
    existingPosition.pnL = PnL;
    existingPosition.unrealisedPnL = 0;
    user.collateral.locked -= existingPosition.margin;
    user.collateral.availabe += existingPosition.margin + PnL;
    user.positions = user.positions.filter(
      (item) => item.marketId !== position.marketId,
    );

    return existingPosition;
  }

  reversePosition(
    position: UserPositions,
    existingPosition: UserPositions,
    userId: string,
  ): UserPositions {
    const user = this.userManager.getUser(userId);
    if (!user) throw new Error("user not found in reverse Position");
    let PnL = 0;
    if (existingPosition.positionType === "LONG")
      PnL =
        (position.averagePrice - existingPosition.averagePrice) *
        existingPosition.qty;
    else
      PnL =
        (existingPosition.averagePrice - position.averagePrice) *
        existingPosition.qty;

    const netQty = position.qty - existingPosition.qty;
    const newMargin = position.qty > 0 ? position.margin * (netQty / position.qty) : 0;
    const releasedMargin = existingPosition.margin + (position.margin - newMargin);
    user.collateral.locked -= releasedMargin;
    user.collateral.availabe += releasedMargin + PnL;
    existingPosition.positionType = position.positionType;
    existingPosition.qty = netQty;
    existingPosition.leverage = position.leverage;
    existingPosition.entryPrice = position.entryPrice;
    existingPosition.averagePrice = position.averagePrice;
    existingPosition.margin = newMargin;
    existingPosition.maintainanceMargin = this.riskManager.calculateMaintainanceMargin(newMargin);
    existingPosition.liquidationPrice =
      this.riskManager.calculateLiquidationMargin(
        position.averagePrice,
        position.leverage,
        position.positionType,
      );
    existingPosition.pnL = PnL;
    existingPosition.realisedPnL += PnL;
    existingPosition.unrealisedPnL = 0;

    return existingPosition;

  }

  public publishPositionUpdate(userId: string, position: UserPositions) {
    const channel = this.redisManager.createChannel(
      "position",
      position.marketId,
      userId,
    );
    void this.redisManager.publish(channel, {
      type: "position",
      marketId: position.marketId,
    } as any);
  }

}
