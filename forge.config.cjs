module.exports = {
  packagerConfig: {
    asar: true,
    derefSymlinks: true,
    dir: '.desktop-stage',
    executableName: 'whatsapp-sender',
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'whatsapp_sender',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
};
