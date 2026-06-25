import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function enviarConviteEquipe({
  para,
  nomeEmpresa,
  linkConvite,
}: {
  para: string
  nomeEmpresa: string
  linkConvite: string
}) {
  await resend.emails.send({
    from: "EVIS <onboarding@resend.dev>",
    to: para,
    subject: `Você foi convidado para ${nomeEmpresa} no EVIS`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <div style="background:#0ea5e9;color:#fff;width:48px;height:48px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;margin-bottom:20px;">E</div>
        <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Você foi convidado</h2>
        <p style="color:#475569;margin:0 0 24px;line-height:1.6;">Junte-se à equipe <strong style="color:#0f172a;">${nomeEmpresa}</strong> no EVIS Team Empresarial.</p>
        <a href="${linkConvite}" style="background:#0ea5e9;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:14px;">Aceitar convite</a>
        <p style="color:#94a3b8;font-size:12px;margin-top:28px;line-height:1.6;">Este link expira em 7 dias. Se você não conhece ${nomeEmpresa}, ignore este e-mail.</p>
      </div>
    `,
  })
}
