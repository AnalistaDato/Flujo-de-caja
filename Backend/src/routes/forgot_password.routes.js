const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User"); // Asegúrate de que el modelo sea correcto

const SECRET_KEY = "1234";

// 📍 1️⃣ Endpoint para solicitar recuperación de contraseña
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findByEmail(email); // Usamos findByEmail en lugar de findOne

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1h" });
    console.log("Token generado:", token); // Esta línea imprime el token en la consola

    // Configurar servicio de correo
    const transporter = nodemailer.createTransport({
      host: "ns383900.host-tugatech.com", // Reemplaza con el servidor SMTP de tu empresa
      port: 465, // Usualmente 465 para SSL, o 587 para TLS
      secure: true, // Usa true si usas SSL, false si usas TLS
      auth: {
        user: "securibot@securicol.com", // Reemplaza con tu nombre de usuario de correo
        pass: "Xw7bs84@5", // Reemplaza con tu contraseña
      },
    });

    const resetLink = `http://localhost:4200/#/reset-password/${token}`;

    const mailOptions = {
      from: "noreply@tuapp.com",
      to: email,
      subject: "Recuperación de contraseña",
      html: `
            <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            color: #333;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            width: 100%;
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #fff;
                            padding: 20px;
                            box-sizing: border-box;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            text-align: center;
                            padding-bottom: 20px;
                        }
                        .header img {
                            width: 150px;
                            height: auto;
                        }
                        .content {
                            text-align: center;
                            padding: 20px 0;
                        }
                        .button {
                            display: inline-block;
                            background-color: #840707;
                            color: #fff;
                            padding: 15px 25px;
                            text-decoration: none;
                            font-weight: bold;
                            border-radius: 5px;
                            margin-top: 20px;
                        }
                        .footer {
                            text-align: center;
                            font-size: 12px;
                            color: #999;
                            margin-top: 40px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="http://localhost:3000/images/Securicol-removebg-preview.png" alt="Logo" />
                        </div>
                        <div class="content">
                            <h2>Recuperación de Contraseña</h2>
                            <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña.</p>
                            <a href="${resetLink}" class="button">Restablecer Contraseña</a>
                        </div>
                        <div class="footer">
                            <p>&copy; 2025 Tu Empresa. Todos los derechos reservados.</p>
                            <p>Si no solicitaste este cambio, por favor ignora este mensaje.</p>
                        </div>
                    </div>
                </body>
            </html>
            `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Se ha enviado un enlace a tu correo" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});

// 📍 2️⃣ Endpoint para restablecer la contraseña
router.post("/reset-password/:token", async (req, res) => {
  const { newPassword } = req.body;
  const { token } = req.params;

  console.log("Token recibido:", token);
  console.log("Nueva contraseña recibida:", newPassword);

  // Verificar que la nueva contraseña no sea undefined o vacía
  if (!newPassword) {
    return res.status(400).json({ message: "La contraseña no puede estar vacía" });
  }

  try {
    // Decodificar el token
    const decoded = jwt.verify(token, "1234"); // Usa la misma clave que al generarlo
    console.log("Token decodificado:", decoded);

    // Buscar al usuario por ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Hashear la nueva contraseña
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    await User.updatePassword(user.id, hashedPassword);

    res.json({ message: "Contraseña restablecida correctamente" });
  } catch (error) {
    console.error("Error al restablecer la contraseña:", error);
    res.status(400).json({ message: "Token inválido o expirado" });
  }
});

module.exports = router;