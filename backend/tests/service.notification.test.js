const {
  normalizeNotificationPreferences,
  getPreferenceKeyFromNotificationType,
} = require("../src/services/notification.service");

describe("notification service preference helpers", () => {
  test("normalizes legacy boolean preference shape", () => {
    const normalized = normalizeNotificationPreferences({
      registration: false,
      healthReminder: true,
    });

    expect(normalized.channels.inApp).toBe(true);
    expect(normalized.channels.email).toBe(true);
    expect(normalized.types.registration.inApp).toBe(true);
    expect(normalized.types.registration.email).toBe(false);
    expect(normalized.types.healthReminder.inApp).toBe(true);
    expect(normalized.types.healthReminder.email).toBe(true);
    expect(normalized.types.community.email).toBe(false);
  });

  test("normalizes nested shape with channel overrides", () => {
    const normalized = normalizeNotificationPreferences({
      channels: {
        email: false,
      },
      types: {
        qrScanEvent: {
          inApp: false,
        },
      },
    });

    expect(normalized.channels.inApp).toBe(true);
    expect(normalized.channels.email).toBe(false);
    expect(normalized.types.qrScanEvent.inApp).toBe(true);
    expect(normalized.types.qrScanEvent.email).toBe(true);
  });

  test("maps notification types to preference keys", () => {
    expect(getPreferenceKeyFromNotificationType("application_status")).toBe(
      "applicationStatus"
    );
    expect(getPreferenceKeyFromNotificationType("chat_assistant")).toBe(
      "chatAssistant"
    );
    expect(getPreferenceKeyFromNotificationType("unknown")).toBe("system");
  });
});
