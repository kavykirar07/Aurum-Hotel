import { Resend } from 'resend';

// Initialize securely. Will fail silently if key is missing in development.
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendBookingConfirmationEmail(
  toEmail: string,
  guestName: string,
  bookingRef: string,
  checkIn: string,
  checkOut: string,
  totalAmount: string
) {
  if (!resend) {
    console.warn(`[Resend] Email skipped. RESEND_API_KEY missing. (To: ${toEmail}, Ref: ${bookingRef})`);
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Aurum Hotel <reservations@aurum-os.com>', // Replace with your verified domain
      to: [toEmail],
      subject: `Booking Confirmation - ${bookingRef} - Aurum Hotel`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #2C3E50;">
          <h1 style="color: #B8860B; font-weight: 300;">Aurum Hotel</h1>
          <h2>Your Reservation is Confirmed</h2>
          <p>Dear ${guestName},</p>
          <p>Thank you for choosing Aurum Hotel. Your booking has been successfully processed.</p>
          
          <div style="background-color: #F8F9FA; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p><strong>Confirmation Number:</strong> ${bookingRef}</p>
            <p><strong>Check-in:</strong> ${new Date(checkIn).toLocaleDateString()}</p>
            <p><strong>Check-out:</strong> ${new Date(checkOut).toLocaleDateString()}</p>
            <p><strong>Total Paid:</strong> $${parseFloat(totalAmount).toFixed(2)}</p>
          </div>

          <p>If you have any questions or require special arrangements, please contact our concierge.</p>
          <p>We look forward to welcoming you.</p>
          <br />
          <p>Warm regards,<br />The Aurum Hotel Team</p>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend] Failed to send email:", error);
    } else {
      console.log(`[Resend] Email sent successfully to ${toEmail}. ID: ${data?.id}`);
    }
  } catch (error) {
    console.error("[Resend] Unexpected error sending email:", error);
  }
}
