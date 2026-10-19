const nodemailer = require("nodemailer");

function buildVerificationEmail(verificationUrl) {
    return `
        <h2>Потвърди регистрацията си</h2>

        <p>
            Благодарим за регистрацията!
        </p>

        <p>
            Натисни бутона по-долу, за да потвърдиш своя имейл.
        </p>

        <p>
            <a href="${verificationUrl}">
                Потвърди имейла
            </a>
        </p>

        <p>
            Ако не си създавал този акаунт,
            игнорирай този имейл.
        </p>
    `;
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.APP_URL}/verify?token=${token}`;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "...",
            html: buildVerificationEmail(verificationUrl)
        });
    } catch (err) {
        throw new Error("Failed to send verification email!", { cause: err });
    }

}

module.exports = { sendVerificationEmail };