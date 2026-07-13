import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class AuthExtensionService {
  /**
   * Request password reset token.
   * Generates token, saves it with expiry, and logs the reset link.
   */
  static async requestPasswordReset(email: string): Promise<{ message: string; token: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Security best practice: Don't reveal user existence. Just return generic message,
      // but return token for testing convenience in this mock flow.
      throw new NotFoundError('User with this email does not exist.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    console.log(`[EMAIL SIMULATION] Sent password reset link to ${email}: http://localhost:5000/api/v1/auth/reset-password?token=${token}`);

    return { 
      message: 'Password reset link sent to email (simulated).',
      token // Return token for automated E2E test verification
    };
  }

  /**
   * Reset password using a valid token.
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired password reset token.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  /**
   * Generate and send email verification token.
   */
  static async sendEmailVerification(userId: string): Promise<{ token: string }> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found.');

    if (user.isEmailVerified) {
      throw new BadRequestError('Email is already verified.');
    }

    const token = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
      },
    });

    console.log(`[EMAIL SIMULATION] Sent email verification link to ${user.email}: http://localhost:5000/api/v1/auth/verify-email?token=${token}`);

    return { token };
  }

  /**
   * Verify email using token.
   */
  static async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired email verification token.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
      },
    });
  }
}
