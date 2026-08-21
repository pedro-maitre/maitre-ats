"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export interface RequestResetResult {
  success: boolean;
  message: string;
  resetLink?: string;
  email?: string;
  error?: string;
}

export interface ValidateTokenResult {
  valid: boolean;
  email?: string;
  name?: string;
  role?: string;
  error?: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message: string;
  role?: string;
  error?: string;
}

/**
 * Solicita a recuperação de senha gerando um token de uso único com validade de 1 hora.
 */
export async function requestPasswordReset(
  email: string,
  baseUrl?: string
): Promise<RequestResetResult> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: "Por favor, informe seu e-mail.", error: "E-mail obrigatório" };
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      // Retorna sucesso genérico para segurança (anti-enumeração)
      return {
        success: true,
        message: "Se o e-mail estiver cadastrado em nossa base, o link de recuperação foi preparado com sucesso.",
      };
    }

    // Remove tokens antigos pendentes para este e-mail
    await prisma.passwordResetToken.deleteMany({
      where: { email: cleanEmail },
    });

    // Gera token seguro e define validade de 1 hora
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token,
        email: cleanEmail,
        expiresAt,
      },
    });

    const rootDomain = baseUrl || process.env.NEXTAUTH_URL || "";
    const resetLink = `${rootDomain}/redefinir-senha/${token}`;

    console.log(`[AUTH] Link de recuperação gerado para ${cleanEmail}: ${resetLink}`);

    return {
      success: true,
      message: "Link de recuperação gerado com sucesso! Utilize o link para criar sua nova senha com segurança.",
      resetLink,
      email: cleanEmail,
    };
  } catch (error: any) {
    console.error("[AUTH] Erro ao solicitar recuperação de senha:", error);
    return {
      success: false,
      message: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
      error: error?.message || "Erro interno",
    };
  }
}

/**
 * Valida se um token de redefinição é autêntico e ainda está dentro do prazo de validade.
 */
export async function validateResetToken(token: string): Promise<ValidateTokenResult> {
  try {
    if (!token) {
      return { valid: false, error: "Token não fornecido." };
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return {
        valid: false,
        error: "Este link de recuperação é inválido ou já foi utilizado.",
      };
    }

    if (new Date() > resetRecord.expiresAt) {
      // Limpa token expirado
      await prisma.passwordResetToken.delete({ where: { token } });
      return {
        valid: false,
        error: "Este link de recuperação expirou (validade de 1 hora). Solicite um novo link.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: resetRecord.email },
      select: { name: true, role: true, email: true },
    });

    return {
      valid: true,
      email: resetRecord.email,
      name: user?.name || "Usuário",
      role: user?.role || "CANDIDATE",
    };
  } catch (error: any) {
    console.error("[AUTH] Erro ao validar token de redefinição:", error);
    return { valid: false, error: "Falha ao validar o link de recuperação." };
  }
}

/**
 * Redefine a senha do usuário com hash bcrypt seguro e invalida o token.
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  try {
    if (!token || !newPassword) {
      return { success: false, message: "Todos os campos são obrigatórios." };
    }

    if (newPassword.length < 6) {
      return { success: false, message: "A nova senha deve ter pelo menos 6 caracteres." };
    }

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord || new Date() > resetRecord.expiresAt) {
      return {
        success: false,
        message: "O link de recuperação é inválido ou já expirou. Solicite um novo.",
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword },
      select: { id: true, email: true, role: true },
    });

    // Remove todos os tokens do e-mail (segurança de uso único)
    await prisma.passwordResetToken.deleteMany({
      where: { email: resetRecord.email },
    });

    console.log(`[AUTH] Senha redefinida com sucesso para o usuário: ${updatedUser.email}`);

    return {
      success: true,
      message: "Sua senha foi redefinida com sucesso! Você já pode fazer login.",
      role: updatedUser.role,
    };
  } catch (error: any) {
    console.error("[AUTH] Erro ao redefinir senha:", error);
    return {
      success: false,
      message: error?.message || "Ocorreu um erro ao redefinir sua senha.",
    };
  }
}
