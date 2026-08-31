import type { User, UserOrders, Order } from "shared-types";

export class UserManager {
  constructor(public users: Map<string, User>, public userIds:string[]) {}
  async addUser(userId: string) {
    let available = 1_000_000;
    let locked = 0;
    this.users.set(userId, {
      userId: userId,
      collateral: { availabe: available, locked: locked },
      positions: [],
      orders: [],
    })

    this.userIds.push(userId);
  }

  getUser(userId:string){ return this.users.get(userId) }
  addOrder(userId:string, order:UserOrders|Order) {
    const user = this.users.get(userId)
    if(!user) throw new Error("user does not exist to add order")
    user.orders.push(order as UserOrders)
  }

  removeOrder(userId: string, orderId: string) {
    const user = this.users.get(userId);
    if (!user) return;
    user.orders = user.orders.filter((o) => o.orderId !== orderId);
  }

  addBalance(user:User, balanceToAdd:number){ user.collateral.availabe += balanceToAdd }
  lockBalance(user:User, margin:number){ user.collateral.availabe -= margin; user.collateral.locked += margin }
  unlockBalance(user: User, margin: number) { user.collateral.availabe += margin; user.collateral.locked -= margin }
  getPositiotns(userId:string){ return this.users.get(userId)?.positions }
  syncBalance(user: User) {}
  
}
