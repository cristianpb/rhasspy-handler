const blue = require("bluetoothctl");

/* Automatic Bluetooth connection */
blue.Bluetooth()

blue.on(blue.bluetoothEvents.Device, function (devices) {
  const hasBluetooth=blue.checkBluetoothController();
  if(hasBluetooth) {
    devices.forEach((device) => {
      blue.connect(device.mac)
    })
  }
})

module.exports = blue;
