import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();


const app = express();
const port = 3000;
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const db = new pg.Client({
  user: process.env.DB_USER,
  host: "localhost",
  database: "foodshop",
  password: process.env.DB_PASSWORD,
  port: 5432,
});
db.connect();

app.get("/", (req, res) => {
  res.render("home.ejs");
});


// ===== REGISTER =====
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const email = req.body.username.toLowerCase().trim();
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (checkResult.rows.length > 0) {
      return res.send("Email already exists. Try logging in.");
    }

    const hash = await bcrypt.hash(password, saltRounds);
    await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, hash]);
    res.render("index.ejs");
  } catch (err) {
    console.error(err);
    res.send("Server error during registration.");
  }
});

// ===== LOGIN =====
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/login", async (req, res) => {
  const email = req.body.username.toLowerCase().trim();
  const loginPassword = req.body.password;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.send("User not found");

    const user = result.rows[0];
    const match = await bcrypt.compare(loginPassword, user.password);
    if (match) {
      res.render("index.ejs");
    } else {
      res.send("Incorrect Password");
    }
  } catch (err) {
    console.error(err);
    res.send("Server error during login.");
  }
});

// ===== FORGOT PASSWORD =====
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password.ejs");
});

app.post("/forgot-password", async (req, res) => {
  const email = req.body.email.toLowerCase().trim();

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.send("Email does not exist");

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    await db.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)",
      [email, token, expiresAt]
    );

    // Send email with reset link (update transporter config for your email)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: "obododickson7@gmail.com",
      to: email,
      subject: "Password Reset Link",
      text: `Click here to reset your password: http://localhost:3000/reset-password/${token}`,
    };

    await transporter.sendMail(mailOptions);

    res.send("Password reset link has been sent to your email.");
  } catch (err) {
    console.error(err);
    res.send("Server error during password reset request.");
  }
});

// ===== RESET PASSWORD =====
app.get("/reset-password/:token", async (req, res) => {
  const token = req.params.token;

  try {
    const result = await db.query(
      "SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) return res.send("Invalid or expired token.");

    res.render("reset-password.ejs", { token });
  } catch (err) {
    console.error(err);
    res.send("Error loading reset page.");
  }
});

app.post("/reset-password", async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) return res.send("Passwords do not match.");

  try {
    const result = await db.query(
      "SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()",
      [token]
    );

    if (result.rows.length === 0) return res.send("Invalid or expired token.");

    const email = result.rows[0].email;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);
    await db.query("DELETE FROM password_resets WHERE token = $1", [token]);

    res.send("Password has been reset. You can now login.");
  } catch (err) {
    console.error(err);
    res.send("Error resetting password.");
  }
});

// ===== HOME =====
app.get("/home", (req, res) => {
  res.render("home.ejs");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
