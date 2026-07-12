# Store identity checklist

Before the first development or production build, verify:

- [x] Expo/EAS project ID: `0b576781-9044-41d1-bd11-9db9883db20e`
- [x] iOS bundle identifier: `com.huertas.unfiltr`
- [ ] Expo owner and project slug from `eas project:info`
- [ ] Current App Store build number
- [ ] Live Android package/application ID
- [ ] Current Google Play version code
- [ ] Apple credentials belong to the existing App Store record
- [ ] Android signing key matches the existing Play Store application

A mismatch in bundle/package identity or Android signing credentials can prevent the new build from updating the existing store app.
