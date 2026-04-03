/**
 * WhatsApp Notification Service
 * Sends order notifications to shop owner via WhatsApp Web URL
 */

interface OrderDetails {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: Array<{
        productName: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    paymentMethod: string;
}

export class WhatsAppService {
    private shopWhatsAppNumber: string;

    constructor() {
        // Shop owner's WhatsApp number (without + prefix)
        this.shopWhatsAppNumber = process.env.SHOP_WHATSAPP_NUMBER || '918369317490';
    }

    /**
     * Generate WhatsApp message URL for new order
     */
    generateOrderNotificationUrl(order: OrderDetails): string {
        const itemsList = order.items
            .map((item) => `• ${item.productName} x${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`)
            .join('\n');

        const message = `🛒 *NEW ORDER RECEIVED*

📋 *Order #${order.orderNumber}*

👤 *Customer Details:*
Name: ${order.customerName}
Phone: ${order.customerPhone}
Address: ${order.customerAddress}

📦 *Items:*
${itemsList}

💰 *Total: ₹${order.total.toFixed(2)}*
💳 *Payment: ${order.paymentMethod}*

---
_Naik Milk Center_`;

        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${this.shopWhatsAppNumber}?text=${encodedMessage}`;
    }

    /**
     * Get the WhatsApp URL for order notification
     * This URL should be returned to frontend to open WhatsApp
     */
    getNotificationData(order: OrderDetails) {
        return {
            whatsappUrl: this.generateOrderNotificationUrl(order),
            shopNumber: this.shopWhatsAppNumber,
        };
    }
}

export const whatsAppService = new WhatsAppService();
