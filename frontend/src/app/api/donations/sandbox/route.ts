import { NextResponse } from "next/server";

type DonationFrequency = "one_time" | "monthly";

type DonationSandboxInput = {
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

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function POST(request: Request) {
  let body: DonationSandboxInput;

  try {
    body = (await request.json()) as DonationSandboxInput;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON payload",
      },
      { status: 400 }
    );
  }

  const amount = Number(body.amount);
  const frequency = body.frequency;
  const donorName = (body.donorName || "").trim();
  const donorEmail = (body.donorEmail || "").trim();
  const cardNumber = onlyDigits(body.cardNumber || "");
  const cardholderName = (body.cardholderName || "").trim();
  const expiryMonth = (body.expiryMonth || "").trim();
  const expiryYear = (body.expiryYear || "").trim();
  const cvc = onlyDigits(body.cvc || "");

  if (!Number.isFinite(amount) || amount < 1 || amount > 10000) {
    return NextResponse.json(
      {
        success: false,
        message: "Amount must be between 1 and 10,000",
      },
      { status: 400 }
    );
  }

  if (frequency !== "one_time" && frequency !== "monthly") {
    return NextResponse.json(
      {
        success: false,
        message: "Frequency must be one_time or monthly",
      },
      { status: 400 }
    );
  }

  if (!donorName || !donorEmail || !cardholderName) {
    return NextResponse.json(
      {
        success: false,
        message: "Name, email, and cardholder name are required",
      },
      { status: 400 }
    );
  }

  if (cardNumber.length < 12 || cardNumber.length > 19) {
    return NextResponse.json(
      {
        success: false,
        message: "Card number is invalid",
      },
      { status: 400 }
    );
  }

  if (cvc.length < 3 || cvc.length > 4) {
    return NextResponse.json(
      {
        success: false,
        message: "CVC is invalid",
      },
      { status: 400 }
    );
  }

  const monthNumber = toNumber(expiryMonth);
  const yearNumber = toNumber(expiryYear);

  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return NextResponse.json(
      {
        success: false,
        message: "Expiry month is invalid",
      },
      { status: 400 }
    );
  }

  if (!Number.isInteger(yearNumber) || yearNumber < 2024 || yearNumber > 2099) {
    return NextResponse.json(
      {
        success: false,
        message: "Expiry year is invalid",
      },
      { status: 400 }
    );
  }

  const cardLast4 = cardNumber.slice(-4);
  const shouldDecline = cardLast4 === "0000" || cvc === "000";

  if (shouldDecline) {
    return NextResponse.json(
      {
        success: true,
        message: "Sandbox donation processed",
        data: {
          transactionId: `sbx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          status: "declined",
          processedAt: new Date().toISOString(),
          amount,
          frequency,
          cardLast4,
          sandbox: true,
          message: "Sandbox rule triggered decline. Use any card that does not end with 0000.",
        },
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      message: "Sandbox donation processed",
      data: {
        transactionId: `sbx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        status: "approved",
        processedAt: new Date().toISOString(),
        amount,
        frequency,
        cardLast4,
        sandbox: true,
        message: "Sandbox payment approved. No real charge was made.",
      },
    },
    { status: 200 }
  );
}
