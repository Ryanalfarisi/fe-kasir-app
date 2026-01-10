const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey123';
// NOTE: In production, store this in env
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'MOCK_CLIENT_ID'; 
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }
    
    // Check if password exists (google users might not have one)
    if (!user.password) {
       return res.status(401).json({ error: 'Akun ini terdaftar via Google. Silakan login dengan Google.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Create Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    console.log("GOOGLE LOGIN: Received credential with length", credential ? credential.length : 0);
    
    // Verify Token
    let payload;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID,  
        });
        payload = ticket.getPayload();
        console.log("GOOGLE LOGIN: Verified Payload for", payload.email);
    } catch (e) {
        console.error("GOOGLE LOGIN Verify FAILED:", e.message);
        return res.status(400).json({ error: 'Invalid Google Token: ' + e.message });
    }

    const { email, sub: googleId, name } = payload;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("GOOGLE LOGIN: User not found, creating new user for", email);
      // Create new user
      const baseUsername = email.split('@')[0];
      let username = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        console.log("GOOGLE LOGIN: Username taken, trying", username);
        counter++;
      }

      user = await prisma.user.create({
        data: {
          name,
          email,
          username,
          googleId,
          role: 'KASIR', // Default role
        },
      });
      console.log("GOOGLE LOGIN: User created", user.username);
    } else {
        console.log("GOOGLE LOGIN: User found", user.username);
        // Update googleId if missing
        if (!user.googleId) {
            console.log("GOOGLE LOGIN: Linking Google ID");
            await prisma.user.update({
                where: { id: user.id },
                data: { googleId }
            });
        }
    }

    // Create Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_KEY,
      { expiresIn: '8h' }
    );
    console.log("GOOGLE LOGIN: Sending response");

    res.json({
      message: 'Login Google berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("GOOGLE LOGIN CONTROLLER ERROR:", error);
    res.status(500).json({ error: 'Google Login failed: ' + error.message });
  }
};
