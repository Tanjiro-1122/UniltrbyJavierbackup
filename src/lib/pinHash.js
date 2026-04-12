/**
 * PIN hashing helpers using the browser's SubtleCrypto API.
 *
 * PINs are stored as SHA-256("unfiltr_pin_v1" + pin) to avoid keeping
 * 4-digit codes in plaintext in localStorage.
 *
 * The PIN is only 4 digits (10,000 combinations), so hashing is not a
 * substitute for strong authentication — it simply prevents the PIN
 * from being visually readable in browser DevTools or device backups.
 */

const PIN_PREFIX = "unfiltr_pin_v1";

/**
 * Compute SHA-256(PIN_PREFIX + pin) and return it as a hex string.
 * @param {string} pin — 4-digit string
 * @returns {Promise<string>} 64-char hex digest
 */
export async function hashPin(pin) {
  const data = new TextEncoder().encode(PIN_PREFIX + pin);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compare an entered PIN against the stored value.
 * Handles both the new hashed format (64-char hex) and the legacy plaintext
 * format (4-char digit string) so existing users are not locked out.
 * On a successful plaintext match the stored value is automatically upgraded
 * to the hashed format.
 *
 * @param {string} enteredPin — 4-digit string typed by the user
 * @returns {Promise<boolean>}
 */
export async function checkPin(enteredPin) {
  const stored = localStorage.getItem("unfiltr_pin");
  if (!stored) return false;

  if (stored.length === 4) {
    // Legacy plaintext format — verify and silently migrate to hash
    if (stored === enteredPin) {
      localStorage.setItem("unfiltr_pin", await hashPin(enteredPin));
      return true;
    }
    return false;
  }

  // New hashed format
  return stored === (await hashPin(enteredPin));
}

/**
 * Store a PIN securely (hashed).
 * @param {string} pin — 4-digit string
 */
export async function storePin(pin) {
  localStorage.setItem("unfiltr_pin", await hashPin(pin));
}

/**
 * Remove the stored PIN, clearing all PIN protection.
 */
export function clearPin() {
  localStorage.removeItem("unfiltr_pin");
}

/**
 * Synchronously check whether a PIN is currently set.
 * Safe to call during component initialization (no async needed).
 * @returns {boolean}
 */
export function hasPin() {
  return !!localStorage.getItem("unfiltr_pin");
}
