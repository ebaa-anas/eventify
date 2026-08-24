const url = "http://127.0.0.1:3000/v1/auth/login";
const body = JSON.stringify({ email: "nobody@example.com", password: "wrong-password" });

async function burst() {
  console.log("Sending 8 rapid login requests...");
  for (let i = 1; i <= 8; i++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    console.log(`Request ${i}: status ${res.status}`);
  }
}

burst();