// Haptic feedback utility — triggers vibration on supported devices
export function hapticLight() {
  if (navigator.vibrate) navigator.vibrate(10);
}

export function hapticMedium() {
  if (navigator.vibrate) navigator.vibrate(25);
}

export function hapticSuccess() {
  if (navigator.vibrate) navigator.vibrate([10, 50, 20]);
}

export function hapticError() {
  if (navigator.vibrate) navigator.vibrate([30, 50, 30, 50, 30]);
}