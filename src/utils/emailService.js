const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} token - Reset token
 */
exports.sendResetPasswordEmail = async (to, token) => {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3001'}/auth/reset-password/${token}`;
    
    const mailOptions = {
        from: `"DocuStudy Support" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Đặt lại mật khẩu - DocuStudy',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #f97316; text-align: center;">Yêu cầu đặt lại mật khẩu</h2>
                <p>Xin chào,</p>
                <p>Bạn nhận được email này vì chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>DocuStudy</strong>.</p>
                <p>Vui lòng nhấn vào nút bên dưới để tiến hành đặt lại mật khẩu của bạn. Liên kết này sẽ hết hạn sau 1 giờ.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
                </div>
                <p>Nếu bạn không yêu cầu thay đổi này, vui lòng bỏ qua email này.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
                <p style="font-size: 12px; color: #888; word-break: break-all;">${resetUrl}</p>
                <p style="text-align: center; color: #999; font-size: 14px;">&copy; 2026 DocuStudy. All rights reserved.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Reset email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
};
