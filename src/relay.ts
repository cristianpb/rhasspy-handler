const Gpio = require('onoff').Gpio;

let LEDPin: any;

if (process.env.DEVICE == "raspberry") {
  LEDPin = new Gpio(12, 'out'); // declare GPIO4 an output
}

export function blinking (blink_time = 2000) {
	const startValue = LEDPin.readSync()

	// Toggle the state of the LED
	const iv = setInterval(_ => LEDPin.writeSync(LEDPin.readSync() ^ 1), 500);

	// Stop blinking the LED after blink_time
	setTimeout(_ => {
		clearInterval(iv); // Stop blinking
		if (startValue) {
			LEDPin.writeSync(1)
		} else {
			LEDPin.writeSync(0)
		}
	}, blink_time);
}

export function changeState (arg: number) {
  if (process.env.DEVICE == "raspberry") {
    LEDPin.writeSync(arg)
  }
}
