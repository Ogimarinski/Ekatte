const nodemailer = require("nodemailer");

jest.mock("nodemailer");

const sendMail = jest.fn();
nodemailer.createTransport.mockReturnValue({ sendMail });

const { sendVerificationEmail } = require("../src/services/email.service");

describe("sendVerificationEmail", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.APP_URL = "https://ekatte.example.com";
        process.env.EMAIL_FROM = "no-reply@ekatte.example.com";
        sendMail.mockResolvedValue();
    });

    test("sends the email to the given address from EMAIL_FROM", async () => {
        await sendVerificationEmail("user@example.com", "abc123");

        expect(sendMail).toHaveBeenCalledTimes(1);
        const [message] = sendMail.mock.calls[0];

        expect(message.to).toBe("user@example.com");
        expect(message.from).toBe("no-reply@ekatte.example.com");
    });

    test("builds a verification URL from APP_URL and the token", async () => {
        await sendVerificationEmail("user@example.com", "abc123");

        const [message] = sendMail.mock.calls[0];

        expect(message.html).toContain("https://ekatte.example.com/verify?token=abc123");
    });

    test("propagates a wrapped error that keeps the SMTP error as cause", async () => {
        const smtpError = new Error("SMTP connection refused");
        sendMail.mockRejectedValue(smtpError);

        const promise = sendVerificationEmail("user@example.com", "abc123");

        await expect(promise).rejects.toThrow("Failed to send verification email!");
        await expect(promise).rejects.toHaveProperty("cause", smtpError);
    });
});
