import { decryptData, encryptData } from "@/lib/encryption";

/** Fields read from DB for decrypt (subset of CustomOrderSubmission). */
export type CustomOrderContactRow = {
  customerEmail?: string | null;
  customerName?: string | null;
  encryptedCustomerEmail?: string | null;
  customerEmailIV?: string | null;
  customerEmailSalt?: string | null;
  encryptedCustomerName?: string | null;
  customerNameIV?: string | null;
  customerNameSalt?: string | null;
};

/**
 * Prefer AES-GCM encrypted contact fields; fall back to legacy plaintext columns.
 */
export function getDecryptedCustomerContact(
  sub: CustomOrderContactRow
): { email: string; name: string } {
  if (
    sub.encryptedCustomerEmail &&
    sub.customerEmailIV &&
    sub.customerEmailSalt
  ) {
    const email = decryptData(
      sub.encryptedCustomerEmail,
      sub.customerEmailIV,
      sub.customerEmailSalt
    );
    let name = "";
    if (
      sub.encryptedCustomerName &&
      sub.customerNameIV &&
      sub.customerNameSalt
    ) {
      name = decryptData(
        sub.encryptedCustomerName,
        sub.customerNameIV,
        sub.customerNameSalt
      );
    }
    return { email, name };
  }
  return {
    email: sub.customerEmail ?? "",
    name: sub.customerName ?? "",
  };
}

/** Payload for Prisma create — only ciphertext; legacy plaintext columns omitted. */
export function buildEncryptedCustomerContactPayload(
  email: string,
  name?: string | null
) {
  const emailEnc = encryptData(email);
  const nameTrimmed = (name || "").trim();
  const nameEnc = nameTrimmed ? encryptData(nameTrimmed) : null;
  return {
    encryptedCustomerEmail: emailEnc.encrypted,
    customerEmailIV: emailEnc.iv,
    customerEmailSalt: emailEnc.salt,
    encryptedCustomerName: nameEnc?.encrypted ?? null,
    customerNameIV: nameEnc?.iv ?? null,
    customerNameSalt: nameEnc?.salt ?? null,
  };
}

const ENCRYPTED_KEYS = [
  "encryptedCustomerEmail",
  "customerEmailIV",
  "customerEmailSalt",
  "encryptedCustomerName",
  "customerNameIV",
  "customerNameSalt",
] as const;

/** Replace stored contact with decrypted values; omit ciphertext from returned object. */
export function withDecryptedCustomerContact<T extends CustomOrderContactRow & Record<string, unknown>>(
  row: T
): Omit<T, (typeof ENCRYPTED_KEYS)[number]> & {
  customerEmail: string;
  customerName: string | null;
} {
  const { email, name } = getDecryptedCustomerContact(row);
  const next = { ...row } as Record<string, unknown>;
  for (const k of ENCRYPTED_KEYS) {
    delete next[k];
  }
  next.customerEmail = email;
  next.customerName = name || null;
  return next as Omit<T, (typeof ENCRYPTED_KEYS)[number]> & {
    customerEmail: string;
    customerName: string | null;
  };
}
