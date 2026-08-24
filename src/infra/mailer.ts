import nodemailer from "nodemailer";

// Ethereal test account is generated once per server start.
async function createTransport() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log("Ethereal test account ready:", testAccount.user);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } catch {
    console.warn("Ethereal unavailable — falling back to console transport");
    return nodemailer.createTransport({ jsonTransport: true });
  }
}

export const mailerPromise = createTransport();