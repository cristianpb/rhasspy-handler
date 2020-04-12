var Apa102spi = require('apa102-spi')

// Apa102spi(number of leds, clock divider)
var LedDriver = new Apa102spi(9, 100)

export function ledsOn() {
  // setLedColor(n, brightness 0-31, red 0-255, green 0-255, blue 0-255)
  LedDriver.setLedColor(0, 0, 255, 0, 0)
  LedDriver.setLedColor(1, 0, 0, 255, 0)
  LedDriver.setLedColor(2, 1, 0, 0, 255)
  LedDriver.setLedColor(3, 0, 255, 0, 0)
  LedDriver.setLedColor(4, 0, 0, 255, 0)
  LedDriver.setLedColor(5, 1, 0, 0, 255)
  LedDriver.setLedColor(6, 0, 255, 0, 0)
  LedDriver.setLedColor(7, 0, 0, 255, 0)
  LedDriver.setLedColor(8, 1, 0, 0, 255)
  LedDriver.sendLeds()
}

export function ledsOff() {
  // setLedColor(n, brightness 0-31, red 0-255, green 0-255, blue 0-255)
  LedDriver.setLedColor(0, 0, 255, 0, 0)
  LedDriver.setLedColor(1, 0, 0, 255, 0)
  LedDriver.setLedColor(2, 0, 0, 0, 255)
  LedDriver.setLedColor(3, 0, 255, 0, 0)
  LedDriver.setLedColor(4, 0, 0, 255, 0)
  LedDriver.setLedColor(5, 0, 0, 0, 255)
  LedDriver.setLedColor(6, 0, 255, 0, 0)
  LedDriver.setLedColor(7, 0, 0, 255, 0)
  LedDriver.setLedColor(8, 0, 0, 0, 255)
  LedDriver.sendLeds()
}
