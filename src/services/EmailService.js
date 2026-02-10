import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const EMAIL_QUEUE_COLLECTION = 'email_trigger_queue';

const replaceVariables = (template, variables) => {
  let result = template;
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  return result;
};

const getInvitationTemplate = (variables) => {
  const template = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a Fortunato SCADA</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f1f5f9;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 40px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; backdrop-filter: blur(10px);">
                <span style="font-size: 36px; font-weight: bold; color: #ffffff;">F</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">¡Has sido invitado!</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Fortunato Industrial IoT SCADA Platform</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                Hola,
              </p>
              <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                <strong>{{ADMIN_NAME}}</strong> te ha invitado a unirte a <strong>{{ORGANIZATION_NAME}}</strong> en la plataforma Fortunato SCADA.
              </p>
              
              <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Organización:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right; font-weight: bold;">{{ORGANIZATION_NAME}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Tu rol será:</td>
                    <td style="padding: 8px 0; text-align: right;">
                      <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">{{ROLE}}</span>
                    </td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <a href="{{INVITATION_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(37,99,235,0.4);">
                  Crear mi cuenta
                </a>
              </div>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 30px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  <strong>⚠️ Importante:</strong> Este enlace solo puede usarse una vez y es personal e intransferible.
                </p>
              </div>

              <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Si no esperabas esta invitación, podés ignorar este email de manera segura.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 12px;">
                © 2026 Fortunato SCADA Platform. Todos los derechos reservados.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                fortunato.ctech@gmail.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return replaceVariables(template, variables);
};

const getWelcomeTemplate = (variables) => {
  const template = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Fortunato SCADA</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f1f5f9;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; backdrop-filter: blur(10px);">
                <span style="font-size: 36px; font-weight: bold; color: #ffffff;">F</span>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">¡Bienvenido a Fortunato!</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Tu cuenta ha sido creada exitosamente</p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #334155; font-size: 16px; line-height: 1.6;">
                Hola <strong>{{USER_NAME}}</strong>,
              </p>
              <p style="margin: 0 0 30px; color: #334155; font-size: 16px; line-height: 1.6;">
                Nos complace darte la bienvenida a la plataforma Fortunato SCADA. Tu cuenta ha sido configurada y ya podés comenzar a utilizarla.
              </p>
              
              <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #166534; font-size: 16px; font-weight: bold;">📋 Detalles de tu cuenta</h3>
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Organización:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right; font-weight: bold;">{{ORGANIZATION_NAME}}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Tu rol:</td>
                    <td style="padding: 8px 0; text-align: right;">
                      <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase;">{{ROLE}}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; font-weight: 600;">Email:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-align: right; font-family: monospace;">{{USER_EMAIL}}</td>
                  </tr>
                </table>
              </div>

              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="margin: 0 0 12px; color: #1e40af; font-size: 16px; font-weight: bold;">🚀 Próximos pasos</h3>
                <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.8;">
                  <li>Accedé al dashboard para ver tus equipos y datos en tiempo real</li>
                  <li>Configurá tu perfil y preferencias personales</li>
                  <li>Explorá las funciones disponibles según tu rol</li>
                  <li>Contactá a tu administrador si necesitás ayuda</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <a href="{{DASHBOARD_LINK}}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(37,99,235,0.4);">
                  Ir al Dashboard
                </a>
              </div>

              <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Si tenés alguna pregunta o necesitás asistencia, no dudes en contactarnos.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 12px;">
                © 2026 Fortunato SCADA Platform. Todos los derechos reservados.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                fortunato.ctech@gmail.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return replaceVariables(template, variables);
};

export const sendInvitationEmail = async (toEmail, adminName, organizationName, role, invitationLink) => {
  try {
    const html = getInvitationTemplate({
      ADMIN_NAME: adminName,
      ORGANIZATION_NAME: organizationName,
      ROLE: role.toUpperCase(),
      INVITATION_LINK: invitationLink
    });

    await addDoc(collection(db, EMAIL_QUEUE_COLLECTION), {
      to: toEmail,
      message: {
        subject: `Invitación a Fortunato SCADA - ${organizationName}`,
        html: html
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error: error.message };
  }
};

export const sendWelcomeEmail = async (toEmail, userName, organizationName, role) => {
  try {
    const dashboardLink = `https://iot-admin-panel.netlify.app/app/dashboard`;
    
    const html = getWelcomeTemplate({
      USER_NAME: userName,
      ORGANIZATION_NAME: organizationName,
      ROLE: role.toUpperCase(),
      USER_EMAIL: toEmail,
      DASHBOARD_LINK: dashboardLink
    });

    await addDoc(collection(db, EMAIL_QUEUE_COLLECTION), {
      to: toEmail,
      message: {
        subject: 'Bienvenido a Fortunato SCADA Platform',
        html: html
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};