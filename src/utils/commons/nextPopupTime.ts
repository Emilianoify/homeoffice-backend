export function calculateNextPopupTime(
  popupFrequency: "standard" | "premium",
): Date {
  const now = new Date();
  let baseMinutes: number;
  let randomRange: number;

  if (popupFrequency === "premium") {
    // Premium (>85% productividad): 50-60 min ± 10 min = 40-70 min
    baseMinutes = Math.floor(Math.random() * (60 - 50 + 1)) + 50; // 50-60
    randomRange = Math.floor(Math.random() * 21) - 10; // ±10
  } else {
    // Standard (≤85% productividad): 45-55 min ± 5 min = 40-60 min
    baseMinutes = Math.floor(Math.random() * (55 - 45 + 1)) + 45; // 45-55
    randomRange = Math.floor(Math.random() * 11) - 5; // ±5
  }

  const finalMinutes = Math.max(30, baseMinutes + randomRange); // Mínimo 30 min
  now.setMinutes(now.getMinutes() + finalMinutes);

  return now;
}
