module.exports = {
  expo: {
    name: 'Orchestra',
    slug: 'orchestra',
    version: '0.0.1',
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0f0f0f'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.orchestra.app'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0f0f0f'
      },
      package: 'com.orchestra.app'
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/favicon.png'
    },
    windows: {
      applicationId: 'Orchestra',
      displayName: 'Orchestra',
      packageDisplayName: 'Orchestra',
      packageName: 'com.orchestra.app',
      publisherDisplayName: 'Orchestra',
      identityName: 'Orchestra',
      targetWindowsVersion: '10.0.19041.0',
      minWindowsVersion: '10.0.17763.0'
    },
    plugins: [
      'expo-font'
    ],
    extra: {
      eas: {
        projectId: 'c74e6f3e-a884-4bcc-bea8-ca8cbfd3460e'
      }
    }
  }
};