import { prisma } from '../config/db';
import { BadRequestError, NotFoundError } from '../utils/errors';

export class KycService {
  /**
   * Submit KYC details for a user.
   */
  static async submitKyc(
    userId: string,
    data: {
      fullName: string;
      address: string;
      dateOfBirth: string;
      idNumber: string;
      idDocumentUrl: string;
    }
  ) {
    const existingKyc = await prisma.kycProfile.findUnique({
      where: { userId },
    });

    if (existingKyc?.status === 'APPROVED') {
      throw new BadRequestError('Your KYC profile is already verified and approved.');
    }

    const kyc = await prisma.kycProfile.upsert({
      where: { userId },
      create: {
        userId,
        status: 'PENDING',
        fullName: data.fullName,
        address: data.address,
        dateOfBirth: data.dateOfBirth,
        idNumber: data.idNumber,
        idDocumentUrl: data.idDocumentUrl,
      },
      update: {
        status: 'PENDING',
        fullName: data.fullName,
        address: data.address,
        dateOfBirth: data.dateOfBirth,
        idNumber: data.idNumber,
        idDocumentUrl: data.idDocumentUrl,
        rejectionReason: null,
      },
    });

    return kyc;
  }

  /**
   * Get user's KYC status and profile.
   */
  static async getKycStatus(userId: string) {
    const kyc = await prisma.kycProfile.findUnique({
      where: { userId },
    });

    if (!kyc) {
      return { status: 'UNSUBMITTED', profile: null };
    }

    return { status: kyc.status, profile: kyc };
  }

  /**
   * Review a user's KYC profile (Admin only).
   */
  static async reviewKyc(
    userId: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ) {
    const kyc = await prisma.kycProfile.findUnique({
      where: { userId },
    });

    if (!kyc) {
      throw new NotFoundError('KYC profile not found for this user.');
    }

    if (status === 'REJECTED' && !rejectionReason) {
      throw new BadRequestError('A rejection reason must be provided if rejecting a KYC profile.');
    }

    const updatedKyc = await prisma.kycProfile.update({
      where: { userId },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
    });

    return updatedKyc;
  }
}
