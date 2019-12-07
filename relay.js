const Gpio = require('onoff').Gpio;
let LEDPin = new Gpio(12, 'out'); // declare GPIO4 an output

function blinking (blink_time = 2000) {
	startValue = LEDPin.readSync()

	// Toggle the state of the LED
	const iv = setInterval(_ => LEDPin.writeSync(LEDPin.readSync() ^ 1), 500);

	// Stop blinking the LED after blink_time
	setTimeout(_ => {
		clearInterval(iv); // Stop blinking
		if (startValue == 1) {
			console.log("Letting up", startValue)
			LEDPin.writeSync(1)
		} else {
			LEDPin.writeSync(0)
		}
	}, blink_time);
}

function changeState (arg) {
	console.log(arg)
	LEDPin.writeSync(arg)
}

module.exports = {
    blinking,
    changeState
}
