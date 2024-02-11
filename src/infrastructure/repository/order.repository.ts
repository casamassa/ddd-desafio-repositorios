import OrderModel from "../db/sequelize/model/order.model";
import Order from "../../domain/entity/order";
import OrderItemModel from "../db/sequelize/model/order-item.model";
import OrderRepositoryInterface from "../../domain/repository/order-repository.interface";
import OrderItem from "../../domain/entity/order_item";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
      await OrderModel.create({
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),    
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update({
        customer_id: entity.customerId,
        total: entity.total(),
    }, {
        where: {
            id: entity.id
        }
    });

    for (const item of entity.items){
      let existingItem = await OrderItemModel.findByPk(item.id);
      if (existingItem) {
        await existingItem.update({
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        });
      } else {
        await OrderItemModel.create({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
          order_id: entity.id
        });
      }

    }
  }
  
  async find(id: string): Promise<Order> {
    let orderModel;
    try {
      orderModel = await OrderModel.findOne({
        where: {
          id,
        },
        include: [OrderItemModel],
        rejectOnEmpty: true,
      });
    } catch (error) {
      throw new Error("Order not found");
    }
    const orderItems: OrderItem[] = [];
    for (const item of orderModel.items){
      const newItem = new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity);
      orderItems.push(newItem);
    }
    const order = new Order(id, orderModel.customer_id, orderItems);
    return order;
  }
  
  async findAll(): Promise<Order[]> {
    const orderModels = await OrderModel.findAll({
      include: [OrderItemModel],
    });

    const orders = orderModels.map((orderModels) => {
      const orderItems: OrderItem[] = [];
      for (const item of orderModels.items) {
        const newItem = new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity);
        orderItems.push(newItem);
      }
      let order = new Order(orderModels.id, orderModels.customer_id, orderItems);
      return order;
    });

    return orders;
  }

}