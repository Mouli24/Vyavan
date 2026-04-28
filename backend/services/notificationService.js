import nodemailer from 'nodemailer';

/**
 * Service for handling email and SMS notifications.
 */
export class NotificationService {
  static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'placeholder@ethereal.email',
      pass: process.env.SMTP_PASS || 'placeholder_pass',
    },
  });

  static async sendMail(to, subject, html) {
    try {
      await this.transporter.sendMail({
        from: '"Vyawan B2B" <no-reply@vyawan.com>',
        to,
        subject,
        html,
      });
      console.log(`[EMAIL SENT] to ${to}: ${subject}`);
    } catch (error) {
      console.error(`[EMAIL FAILED] to ${to}:`, error);
      throw error;
    }
  }

  static async sendSMSStub(phone, message) {
    console.log(`[SMS STUB] to ${phone}: ${message}`);
  }

  static async sendPreDueReminder(buyerEmail, orderId, amountDue, dueDate) {
    const subject = `Payment Due in 2 Days — Order #${orderId}`;
    const html = `
      <h1>Payment Reminder</h1>
      <p>This is a friendly reminder that payment for order <strong>#${orderId}</strong> is due in 2 days.</p>
      <p><strong>Amount Due:</strong> Rs. ${amountDue}</p>
      <p><strong>Due Date:</strong> ${dueDate.toDateString()}</p>
      <p>Please ensure payment is made to avoid credit term suspension.</p>
      <br/>
      <small>Vyawan B2B Platform</small>
    `;
    await this.sendMail(buyerEmail, subject, html);
    await this.sendSMSStub('BuyerPhone', `Reminder: Payment for #${orderId} (Rs. ${amountDue}) is due on ${dueDate.toDateString()}.`);
  }

  static async sendOverdueReminder(buyerEmail, orderId, amountDue, daysOverdue) {
    let subject = '';
    let body = '';

    if (daysOverdue === 1) {
      subject = `Payment Overdue — Order #${orderId}`;
      body = `Your payment for order #${orderId} is now 1 day overdue. As a result, your credit terms have been temporarily suspended. Please clear the balance of Rs. ${amountDue} immediately.`;
    } else if (daysOverdue === 3) {
      subject = `Reminder: Payment Still Outstanding — Order #${orderId}`;
      body = `Your payment for order #${orderId} is now 3 days overdue. We urge you to clear the balance of Rs. ${amountDue}. Please contact the manufacturer if there are any issues.`;
    } else {
      subject = `Urgent: Payment ${daysOverdue} Days Overdue — Order #${orderId}`;
      body = `URGENT: Your payment for order #${orderId} is ${daysOverdue} days overdue. Your account is at risk of permanent suspension. Please settle the amount of Rs. ${amountDue} now.`;
    }

    const html = `
      <h1>Overdue Payment Notice</h1>
      <p>${body}</p>
      <p><strong>Amount Outstanding:</strong> Rs. ${amountDue}</p>
      <br/>
      <small>Vyawan B2B Platform</small>
    `;
    await this.sendMail(buyerEmail, subject, html);
  }

  static async sendManufacturerNotification(mfrEmail, buyerName, orderId, amount, daysOverdue) {
    const subject = `New Overdue Payment: ${buyerName}`;
    const html = `
      <h1>Overdue Payment Alert</h1>
      <p>The buyer <strong>${buyerName}</strong> has an overdue payment for order <strong>#${orderId}</strong>.</p>
      <p><strong>Amount:</strong> Rs. ${amount}</p>
      <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
      <p>You can view all overdue payments on your <a href="#">Receivables Dashboard</a>.</p>
      <br/>
      <small>Vyawan B2B Platform</small>
    `;
    await this.sendMail(mfrEmail, subject, html);
  }

  static async sendManufacturerDailySummary(mfrEmail, overdueCount, totalOutstanding) {
    const subject = `Daily Overdue Summary — ${overdueCount} Items`;
    const html = `
      <h1>Daily Overdue Summary</h1>
      <p>You have <strong>${overdueCount}</strong> orders currently overdue.</p>
      <p><strong>Total Outstanding:</strong> Rs. ${totalOutstanding}</p>
      <p>Please log in to your dashboard to manage these receivables.</p>
      <br/>
      <small>Vyawan B2B Platform</small>
    `;
    await this.sendMail(mfrEmail, subject, html);
  }
}
