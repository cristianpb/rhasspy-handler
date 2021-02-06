import { setWakeUpAlarm, listCurrentAlarms, listNextAlarms, deleteOneAlarm, deleteAllAlarms } from '../src/alarms'; 

test('Set new alarm', () => {
  setWakeUpAlarm(10, 20);
  const alarms = listCurrentAlarms()
  expect(alarms).toContain('domingo 10 20 am');
});

test('Delete one alarm', () => {
  deleteAllAlarms();
  setWakeUpAlarm(10, 20);
  setWakeUpAlarm(10, 40);
  deleteOneAlarm(10, 20);
  const alarms = listCurrentAlarms()
  alarms.some(alarm => {
      expect(alarm).toMatch(/10 40 am/);
  })
  expect(alarms).toHaveLength(1);
});

test('Delete all alarms', () => {
  deleteAllAlarms();
  setWakeUpAlarm(10, 20);
  setWakeUpAlarm(10, 40);
  setWakeUpAlarm(11, 20);
  setWakeUpAlarm(11, 40);
  deleteAllAlarms();
  const alarms = listCurrentAlarms()
  expect(alarms).toHaveLength(0);
});
