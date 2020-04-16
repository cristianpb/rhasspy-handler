import Apa102spi from 'apa102-spi';

const LedDriver = new Apa102spi(4, 100)

let iv:any

function setLedColor(num: number) {
	LedDriver.setLedColor(0, (num) % 3, 0, 0, 255)
	LedDriver.setLedColor(1, (num + 1) % 3, 0, 0, 255)
	LedDriver.setLedColor(2, (num + 2) % 3, 0, 0, 255)
	LedDriver.sendLeds()
}

function* loopingColors() {
	let number = 0;
	while (true) {
		yield setLedColor(number)
		number++
	}
}

export function ledsOn() {
  const it = loopingColors()
  iv = setInterval(function(){ it.next() }, 100);
}

export function ledsOff() {
  clearInterval(iv); // Stop blinking
  LedDriver.setLedColor(0, 0, 255, 0, 0)
  LedDriver.setLedColor(1, 0, 0, 255, 0)
  LedDriver.setLedColor(2, 0, 0, 0, 255)
  LedDriver.sendLeds()
}
