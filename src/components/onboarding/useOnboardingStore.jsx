// Simple global store for onboarding state (persists across page navigations)
const store = {
  displayName: "",
  selectedCompanion: null,
  companionNickname: "",
  selectedBackground: null,
  pendingProfileId: null,
};

export function getOnboardingStore() {
  return store;
}

export function updateOnboardingStore(updates) {
  Object.assign(store, updates);
}

export function resetOnboardingStore() {
  store.displayName = "";
  store.selectedCompanion = null;
  store.companionNickname = "";
  store.selectedBackground = null;
  store.isTesterAccount = false;
  store.pendingProfileId = null;
}