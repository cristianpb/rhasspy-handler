declare class Apa102spi {
  // Apa102spi(number of leds, clock divider)
  constructor(led: number, clock: number)

  setLedColor(led: number, brightness: number, r: number, g: number, b: number): void

  sendLeds():void
}

declare module 'apa102-spi' {
    export default Apa102spi;
}
