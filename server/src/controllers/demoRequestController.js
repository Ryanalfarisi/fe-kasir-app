const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');

// Configure simulated transport (or real one if provided)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'ethereal.user@example.com',
        pass: 'ethereal.pass'
    }
});

exports.createRequest = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email wajib diisi' });

        const request = await prisma.demoRequest.create({
            data: { email }
        });

        res.json({ message: 'Permintaan demo dikirim. Tunggu persetujuan admin.', request });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal mengirim permintaan' });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const requests = await prisma.demoRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    } catch (error) {
        console.error('GET REQUESTS ERROR:', error);
        res.status(500).json({ error: 'Gagal mengambil data' });
    }
};

exports.approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await prisma.demoRequest.findUnique({ where: { id: Number(id) } });
        
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.status === 'APPROVED') return res.status(400).json({ error: 'Sudah disetujui sebelumnya' });

        // Generate Credentials
        const rand = Math.floor(1000 + Math.random() * 9000);
        const username = `demo_${rand}`;
        const password = `pass${rand}`; // Plain text for email
        
        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        await prisma.user.create({
            data: {
                name: `Demo User ${rand}`,
                username: username,
                password: hashedPassword,
                email: request.email,
                role: 'KASIR'
            }
        });

        // Update Request Status
        await prisma.demoRequest.update({
            where: { id: Number(id) },
            data: { status: 'APPROVED' }
        });

        // Simulate Email Sending
        console.log("==========================================");
        console.log(`[EMAIL SIMULATION] To: ${request.email}`);
        console.log(`Subject: Akun Demo Kasir App Anda Siap`);
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);
        console.log("==========================================");

        // Try sending real email if configured (will fail with ethernet mock but safe to try)
        // await transporter.sendMail(...) 

        res.json({ message: 'Permintaan disetujui. Email terkirim (Simulasi di Console).', username, password });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Gagal memproses persetujuan' });
    }
};
