const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
  constructor() {
    this.transporter = null;
    this.disabled = process.env.DISABLE_EMAILS === 'true';
    this.setupTransporter();
  }

  setupTransporter() {
    // Respect explicit disable flag first
    if (this.disabled) {
      console.log('📧 Email sending disabled via DISABLE_EMAILS=true');
      return;
    }

    // Check if email configuration is provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.log('❌ Email service error:', error);
        } else {
          console.log('✅ Email service is ready to send messages');
        }
      });
    } else {
      console.log('📧 Email service not configured. Email functionality will be disabled.');
    }
  }

  async sendEmail(options) {
    if (this.disabled) {
      console.log('📧 Email disabled - skipping send to', options.to);
      return { success: true, skipped: true, message: 'Email sending disabled by DISABLE_EMAILS' };
    }

    if (!this.transporter) {
      console.log('📧 Email not sent - service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"LifeLink System" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Templates
  generateEmailTemplate(templateName, data) {
    const templates = {
      // Hospital Registration Templates
      hospitalApproved: {
        subject: '🏥 Hospital Registration Approved - LifeLink',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🏥 LifeLink</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Smart Blood & Organ Donation Management</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #28a745; margin-top: 0;">🎉 Congratulations! Your Hospital Registration is Approved</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.hospitalName} Team,</p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                We are pleased to inform you that your hospital registration with LifeLink has been <strong>approved</strong>! 
                You can now access all hospital features and start managing your blood and organ donation services.
              </p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
                <ul style="color: #666; line-height: 1.8;">
                  <li>Login to your hospital dashboard</li>
                  <li>Update your inventory information</li>
                  <li>Start receiving donation appointments</li>
                  <li>Create emergency tickets when needed</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/hospital/dashboard" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Access Dashboard</a>
              </div>
              <p style="font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                If you have any questions, please contact our support team.<br>
                Best regards,<br>
                <strong>LifeLink Team</strong>
              </p>
            </div>
          </div>
        `
      },

      hospitalRejected: {
        subject: '🏥 Hospital Registration Update - LifeLink',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🏥 LifeLink</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Smart Blood & Organ Donation Management</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #dc3545; margin-top: 0;">Hospital Registration Review</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.hospitalName} Team,</p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Thank you for your interest in joining LifeLink. After careful review, we need additional information before we can approve your registration.
              </p>
              ${data.notes ? `
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <strong>Review Notes:</strong><br>
                  ${data.notes}
                </div>
              ` : ''}
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Please review the information you provided and resubmit your application. Our team is here to help you through the process.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/register" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Resubmit Application</a>
              </div>
              <p style="font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                If you have questions about this decision, please contact our support team.<br>
                Best regards,<br>
                <strong>LifeLink Team</strong>
              </p>
            </div>
          </div>
        `
      },

      // Appointment Templates
      appointmentConfirmed: {
        subject: '📅 Appointment Confirmed - LifeLink',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">📅 Appointment Confirmed</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">LifeLink Donation System</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.donorName},</p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Your donation appointment has been confirmed! Thank you for your generous commitment to saving lives.
              </p>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Appointment Details</h3>
                <p style="margin: 5px 0;"><strong>Hospital:</strong> ${data.hospitalName}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${data.appointmentDate}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${data.appointmentTime}</p>
                <p style="margin: 5px 0;"><strong>Type:</strong> ${data.donationType}</p>
                <p style="margin: 5px 0;"><strong>Appointment ID:</strong> ${data.appointmentId}</p>
              </div>
              <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <strong>Preparation Guidelines:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Get adequate rest (7-8 hours of sleep)</li>
                  <li>Eat a healthy meal before donation</li>
                  <li>Stay well hydrated</li>
                  <li>Bring a valid ID and this appointment confirmation</li>
                  <li>Avoid alcohol 24 hours before donation</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/donor/appointments" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">View Details</a>
                <a href="${process.env.CLIENT_URL}/contact" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Contact Hospital</a>
              </div>
              <p style="font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                Thank you for making a difference in someone's life!<br>
                Best regards,<br>
                <strong>LifeLink Team</strong>
              </p>
            </div>
          </div>
        `
      },

      appointmentReminder: {
        subject: '🔔 Appointment Reminder - LifeLink',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🔔 Appointment Reminder</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Don't forget your upcoming donation</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.donorName},</p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                This is a friendly reminder about your upcoming donation appointment scheduled for <strong>${data.appointmentDate}</strong>.
              </p>
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h3 style="margin-top: 0;">⏰ Your appointment is in ${data.hoursUntil} hours</h3>
                <p style="margin: 5px 0;"><strong>${data.hospitalName}</strong></p>
                <p style="margin: 5px 0;">${data.appointmentDate} at ${data.appointmentTime}</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Your contribution can save up to 3 lives. Thank you for your commitment to helping others!
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/donor/appointments" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Appointment</a>
              </div>
              <p style="font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                If you need to reschedule, please contact us as soon as possible.<br>
                Best regards,<br>
                <strong>LifeLink Team</strong>
              </p>
            </div>
          </div>
        `
      },

      // Emergency/Urgent Templates
      emergencyBloodRequest: {
        subject: '🚨 URGENT: Blood Request - LifeLink',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🚨 EMERGENCY BLOOD NEEDED</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Immediate donation needed</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 20px; border-radius: 8px; margin: 0 0 20px 0; text-align: center;">
                <h2 style="margin-top: 0;">CRITICAL BLOOD SHORTAGE</h2>
                <p style="font-size: 18px; margin: 10px 0;"><strong>Blood Type Needed: ${data.bloodType}</strong></p>
                <p style="font-size: 16px; margin: 10px 0;">Quantity: ${data.quantity} units</p>
                <p style="font-size: 14px; margin: 10px 0;">Hospital: ${data.hospitalName}</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.donorName || 'Donor'},</p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                We have an <strong>URGENT</strong> need for ${data.bloodType} blood donations at ${data.hospitalName}. 
                A patient's life depends on finding compatible donors immediately.
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                If you are eligible to donate and available, please respond to this emergency request as soon as possible.
                Every minute counts in saving a life.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/donor/appointments/emergency" style="background: #dc3545; color: white; padding: 20px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">RESPOND TO EMERGENCY</a>
              </div>
              <p style="font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                Thank you for being a hero in someone's time of need.<br>
                <strong>LifeLink Emergency Response Team</strong>
              </p>
            </div>
          </div>
        `
      },

      // Welcome Templates
      welcomeDonor: {
        subject: '🙏 Welcome to LifeLink - Thank You for Joining Our Life-Saving Community',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🙏 Welcome to LifeLink</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for joining our life-saving community</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">Dear ${data.donorName},</p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Welcome to LifeLink! We're thrilled to have you join our community of life-savers. 
                Your decision to become a donor means you're ready to make a real difference in people's lives.
              </p>
              <div style="background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📊 Your Impact Potential</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>One blood donation can save up to 3 lives</li>
                  <li>Your blood type (${data.bloodType}) is needed by hospitals in your area</li>
                  <li>Regular donors help maintain critical blood supplies</li>
                </ul>
              </div>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">🎯 Getting Started</h3>
                <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Complete your profile information</li>
                  <li>Browse nearby hospitals</li>
                  <li>Schedule your first donation appointment</li>
                  <li>Set up your donation preferences</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/donor/dashboard" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">Complete Profile</a>
                <a href="${process.env.CLIENT_URL}/donor/hospitals" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Find Hospitals</a>
              </div>
              <p style="font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                Together, we can save lives, one donation at a time.<br>
                Welcome aboard!<br>
                <strong>LifeLink Team</strong>
              </p>
            </div>
          </div>
        `
      },

      // General notification template
      notification: {
        subject: data => data.subject || 'LifeLink Notification',
        html: data => `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">${data.title || 'LifeLink'}</h1>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
              ${data.content}
              <p style="font-size: 14px; color: #666; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                Best regards,<br>
                <strong>LifeLink Team</strong>
              </p>
            </div>
          </div>
        `
      }
    };

    const template = templates[templateName];
    if (!template) {
      return null;
    }

    return {
      subject: typeof template.subject === 'function' ? template.subject(data) : template.subject,
      html: typeof template.html === 'function' ? template.html(data) : template.html
    };
  }

  // Specific email sending methods
  async sendHospitalApprovalEmail(hospitalData, notes = '') {
    const template = this.generateEmailTemplate('hospitalApproved', {
      hospitalName: hospitalData.hospitalName,
      notes
    });

    if (!template) return { success: false, message: 'Template not found' };

    return await this.sendEmail({
      to: hospitalData.email,
      subject: template.subject,
      html: template.html
    });
  }

  async sendHospitalRejectionEmail(hospitalData, notes = '') {
    const template = this.generateEmailTemplate('hospitalRejected', {
      hospitalName: hospitalData.hospitalName,
      notes
    });

    if (!template) return { success: false, message: 'Template not found' };

    return await this.sendEmail({
      to: hospitalData.email,
      subject: template.subject,
      html: template.html
    });
  }

  async sendAppointmentConfirmation(appointmentData) {
    const template = this.generateEmailTemplate('appointmentConfirmed', appointmentData);

    if (!template) return { success: false, message: 'Template not found' };

    return await this.sendEmail({
      to: appointmentData.donorEmail,
      subject: template.subject,
      html: template.html
    });
  }

  async sendAppointmentReminder(appointmentData) {
    const template = this.generateEmailTemplate('appointmentReminder', appointmentData);

    if (!template) return { success: false, message: 'Template not found' };

    return await this.sendEmail({
      to: appointmentData.donorEmail,
      subject: template.subject,
      html: template.html
    });
  }

  async sendEmergencyBloodRequest(requestData) {
    const template = this.generateEmailTemplate('emergencyBloodRequest', requestData);

    if (!template) return { success: false, message: 'Template not found' };

    return await this.sendEmail({
      to: requestData.donorEmail,
      subject: template.subject,
      html: template.html
    });
  }

  async sendWelcomeEmail(donorData) {
    const template = this.generateEmailTemplate('welcomeDonor', donorData);

    if (!template) return { success: false, message: 'Template not found' };

    return await this.sendEmail({
      to: donorData.email,
      subject: template.subject,
      html: template.html
    });
  }

  async sendBulkEmergencyAlerts(donors, requestData) {
    const results = [];
    
    for (const donor of donors) {
      try {
        const result = await this.sendEmergencyBloodRequest({
          ...requestData,
          donorName: `${donor.personalInfo.firstName} ${donor.personalInfo.lastName}`,
          donorEmail: donor.user.email
        });
        results.push({ donorId: donor._id, result });
      } catch (error) {
        results.push({ donorId: donor._id, result: { success: false, error: error.message } });
      }
    }

    return results;
  }
}

module.exports = new EmailService();