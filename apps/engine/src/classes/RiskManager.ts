import type { Order } from "shared-types"
import type { positionType } from "shared-types"
import type { OrderBook } from "./OrderBook"

export class RiskManager{
    private maintainanceMarginPercent = 5
    constructor(private orderBookManager:OrderBook){}
    calculateMargin(data:Order){
        let price = data.price;
        if (!price || data.marketType === "MARKET") {
            const book = this.orderBookManager.getBook(data.marketId);
            if (book) {
                const bestPrice = this.orderBookManager.getBestPrice(data.positionType, book);
                price = bestPrice ?? book.lastTradedPrice;
            }
            if (!price) throw new Error("Price is required for margin calculation");
        }
        return (price * data.qty) / data.leverage
    }
    calculateMaintainanceMargin(margin:number){
        return (margin * this.maintainanceMarginPercent) / 100
    }
    calculateLiquidationMargin(entryPrice:number, leverage:number, positionType:positionType){
        let liquidationPrice = 0
        if(positionType === "LONG"){
            liquidationPrice = entryPrice*(1-(1/leverage)+(this.maintainanceMarginPercent/100))
        } else {
            liquidationPrice = entryPrice*(1+(1/leverage)-(this.maintainanceMarginPercent/100))
        }
        return liquidationPrice
    }
}
