export type DonationFrequency = "one_time" | "monthly";

export type DonationSandboxInput = {
  amount: number;
  frequency: DonationFrequency;
  donorName: string;
  donorEmail: string;
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
};

export type DonationSandboxResult = {
  transactionId: string;
  status: "approved" | "declined";
  processedAt: string;
  amount: number;
  frequency: DonationFrequency;
  cardLast4: string;
  sandbox: true;
  message: string;
};

type DonationSandboxApiResponse = {
  success: boolean;
  message?: string;
  data?: DonationSandboxResult;
};

export async function submitDonationSandbox(input: DonationSandboxInput) {
  const response = await fetch("/api/donations/sandbox", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as DonationSandboxApiResponse;

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.message || "Unable to process sandbox donation");
  }

  return payload.data;
}
