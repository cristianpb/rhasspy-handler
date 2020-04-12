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
			console.log("Letting up", startValue)
			LEDPin.writeSync(true)
		} else {
			LEDPin.writeSync(false)
		}
	}, blink_time);
}

export function changeState (arg: boolean) {
	LEDPin.writeSync(arg)
}
