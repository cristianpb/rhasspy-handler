import { Gpio, BinaryValue } from 'onoff';

let button: Gpio;
let LEDPin: Gpio;

if (process.env.DEVICE == "raspberry") {
  LEDPin = new Gpio(12, 'out'); // declare GPIO4 an output
  //button = new Gpio(17, 'in', 'both');
  button = new Gpio(17, 'in', 'rising', {debounceTimeout: 10});
  button.watch((err, _) => {
    if (err) {
      throw err;
    }
    LEDPin.writeSync((LEDPin.readSync() ^ 1) as BinaryValue);
  });
}

export function blinking (blink_time = 2000) {
	const startValue = LEDPin.readSync()

	// Toggle the state of the LED
	const iv = setInterval(_ => LEDPin.writeSync((LEDPin.readSync() ^ 1) as BinaryValue), 500);

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

export function changeState (arg: BinaryValue) {
  if (process.env.DEVICE == "raspberry") {
    LEDPin.writeSync(arg)
  }
}

process.on('SIGINT', _ => {
  LEDPin.unexport();
  button.unexport();
});
