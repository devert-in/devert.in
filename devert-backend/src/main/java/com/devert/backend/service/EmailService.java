package com.devert.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendChallengeConfirmation(String toEmail, String leadName, String teamName) {
        String subject = "🔐 DEPLOYMENT AUTHORIZED: Squad " + teamName + " Activated";

        // This is the HTML Template we designed
        String htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                <style>
                  body { background-color: #050505; color: #a0a0a0; font-family: 'Courier New', Courier, monospace; padding: 20px; }
                  .container { max-width: 600px; margin: 0 auto; border: 1px solid #333; background-color: #0a0a0a; }
                  .header { background-color: #000; padding: 20px; border-bottom: 2px solid #a855f7; text-align: center; }
                  .logo { color: #fff; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
                  .content { padding: 30px; line-height: 1.6; }
                  .status-badge { background-color: rgba(0, 255, 157, 0.1); color: #00ff9d; padding: 4px 8px; border: 1px solid #00ff9d; font-size: 12px; display: inline-block; margin-bottom: 20px; }
                  .highlight { color: #fff; font-weight: bold; }
                  .btn { display: inline-block; background-color: #a855f7; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; margin-top: 20px; border: 1px solid #a855f7; }
                  .footer { border-top: 1px solid #333; padding: 20px; font-size: 10px; text-align: center; color: #555; }
                </style>
                </head>
                <body>

                <div class="container">

                  <!-- Header -->
                  <div class="header">
                    <div class="logo">DEVERT<span style="color:#a855f7">.IN</span></div>
                    <div style="font-size: 10px; color: #555; margin-top: 5px;">SECURE_TRANSMISSION // ENCRYPTED</div>
                  </div>

                  <!-- Content -->
                  <div class="content">
                    <div class="status-badge">● STATUS: CONFIRMED</div>

                    <p>ATTN: OPERATIVE <span class="highlight">%s</span>,</p>

                    <p>This is an automated confirmation from Central Command.</p>

                    <p>Your squad, <span class="highlight" style="color:#a855f7">[%s]</span>, has been successfully registered for the DeVert Innovation Challenge.</p>

                    <div style="background-color: #111; padding: 15px; border-left: 3px solid #00ff9d; margin: 20px 0;">
                      <strong style="color: #00ff9d;">MISSION DIRECTIVES:</strong>
                      <ul style="list-style-type: none; padding-left: 0; margin-top: 10px;">
                        <li style="margin-bottom: 8px;">[1] <strong>Await Intel:</strong> Detailed problem statements will be decrypted on the dashboard shortly.</li>
                        <li style="margin-bottom: 8px;">[2] <strong>Prepare Hardware:</strong> Ensure your local environment is ready for rapid deployment.</li>
                        <li style="margin-bottom: 8px;">[3] <strong>Review Protocols:</strong> Violating submission rules will result in immediate disqualification.</li>
                      </ul>
                    </div>

                    <p>You are now authorized to access the Operator Dashboard to manage your squad details.</p>

                    <center>
                      <a href="https://devert.in/challenge" class="btn">ACCESS_DASHBOARD</a>
                    </center>

                    <p style="margin-top: 30px; font-style: italic;">"We are watching. Make it count."</p>
                  </div>

                  <!-- Footer -->
                  <div class="footer">
                    <p>SYSTEM_ID: #DVC-2026-REG<br>
                    © 2026 DEVERT.IN. All Rights Reserved.<br>
                    <a href="#" style="color: #555;">Unsubscribe</a> (Not Recommended: Vital Intel)</p>
                  </div>

                </div>

                </body>
                </html>
                """
                .formatted(leadName, teamName);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
