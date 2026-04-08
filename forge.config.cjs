module.exports = {
  packagerConfig: {
    asar: false,
    dir: '.desktop-stage',
    executableName: 'whatsapp-sender',
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
};
