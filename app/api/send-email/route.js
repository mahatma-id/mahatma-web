import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        const { to, subject, html } = await req.json();

        // Konfigurasi SMTP Gmail
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        // Opsi pengiriman email
        const mailOptions = {
            from: `"Mahatma Academy" <${process.env.SMTP_EMAIL}>`,
            to: to,
            subject: subject,
            html: html,
        };

        await transporter.sendMail(mailOptions);
        return Response.json({ success: true, message: "Email terkirim!" }, { status: 200 });
        
    } catch (error) {
        console.error("Error Nodemailer:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
}