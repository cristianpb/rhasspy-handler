import Apa102spi from 'apa102-spi';

const LedDriver = new Apa102spi(4, 100)

let iv:any

function setLedColor(num: number, R: number, G: number, B: number) {
	LedDriver.setLedColor(0, (num) % 3, R, G, B)
	LedDriver.setLedColor(1, (num + 1) % 3, R, G, B)
	LedDriver.setLedColor(2, (num + 2) % 3, R, G, B)
	LedDriver.sendLeds()
}

function* loopingColors() {
	let counter = 0;
	while (true) {
		yield setLedColor(counter, 0, 0, 255)
		counter++
	}
}

export function ledsYellow() {
  setLedColor(0, 0, 128, 0);
  setTimeout( () => { ledsOff() }, 1500)
}

export function ledsRed() {
  setLedColor(0, 220, 20, 60);
  setTimeout( () => { ledsOff() }, 1500)
}

export function ledsOn() {
  const it = loopingColors()
  iv = setInterval(function(){ it.next() }, 100);
}

export function stopLoop() {
  clearInterval(iv); // Stop blinking
}

export function ledsOff() {
  LedDriver.setLedColor(0, 0, 255, 0, 0)
  LedDriver.setLedColor(1, 0, 0, 255, 0)
  LedDriver.setLedColor(2, 0, 0, 0, 255)
  LedDriver.sendLeds()
}
