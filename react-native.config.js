const windowsConfig = require('react-native-windows/react-native.config');

module.exports = {
  ...windowsConfig,
  project: {
    windows: {
      sourceDir: 'windows',
      solutionFile: 'Orchestra.sln',
      project: {
        projectFile: 'Orchestra/Orchestra.vcxproj',
      },
    },
  },
};
