import { CronJob } from 'cron';
import { RhasspyMopidy } from './rhasspymopidy';
import { DateTime } from "luxon";
import moment from 'moment';
import 'moment/locale/es';
import { volumeSetSnapcast } from './snapcast';

moment.locale('es');

let cronJobList: CronJob[] = [];

export function setWakeUpAlarm(hour: number, minutes: number) {
  const job = CronJob.from({
    cronTime: `${minutes} ${hour} * * *`,
    onTick: function () {
      RhasspyMopidy.volumeSet(2, false);
      volumeSetSnapcast('raspi', 10);
      volumeSetSnapcast('raspicam', 10);
      volumeSetSnapcast('raspimov', 10);
      const morningPlaylist = Array('CafeCroissant', 'ReveilDouceur', 'WakeUpHappy', 'MorningMotivation')
      const playlist = morningPlaylist[Math.floor(Math.random() * morningPlaylist.length)];
      RhasspyMopidy.setPlaylist(playlist);
      setTimeout(function(){ RhasspyMopidy.volumeSet(3, false); }, 60000);
      setTimeout(function(){ RhasspyMopidy.volumeSet(4, false); }, 180000);
      setTimeout(function(){ RhasspyMopidy.volumeSet(5, false); }, 360000);
    },
    start: true,
    timeZone: 'Europe/Paris'
  });
  cronJobList.push(job);
  RhasspyMopidy.speak(`La alarma sonará a las ${hour} y ${minutes}`);
}

export function deleteAllAlarms() {
  cronJobList.forEach(job => {
    job.stop()
  })
  cronJobList.length = 0
  RhasspyMopidy.speak(`Alarmas borradas`);
}

export function deleteOneAlarm(day: number, hour: number) {
  //const dateAlarm = moment({day: day, hour: hour});
  const dateAlarm = DateTime.fromObject({day: day, hour: hour })
  //dt.toLocaleString({ month: 'long', day: 'numeric' }); //=> 'April 20'
  const deleteAlarmInd = cronJobList.findIndex(item => item.nextDates()[0].toLocaleString({ day: 'numeric', hour: "numeric", minute: "numeric" }) == dateAlarm.toLocaleString({ day: 'numeric', hour: "numeric", minute: "numeric" }) )
  cronJobList[deleteAlarmInd].stop()
  const deletedAlarm = cronJobList.splice(deleteAlarmInd, deleteAlarmInd + 1);
  if (deletedAlarm.length > 0) {
    const nextAlarm = deletedAlarm.map(x => x.nextDates()[0].toLocaleString({ day: 'numeric', hour: "numeric", minute: "numeric"}))
    RhasspyMopidy.speak(`Alarma de ${nextAlarm} borrada`);
  } else {
    RhasspyMopidy.speak(`No se borraron alarmas. Hay ${cronJobList.length}`);
  }
}

export function listNextAlarms() {
  RhasspyMopidy.speak(`a completar`);
  //let now = DateTime.fromObject({day: day, hour: hour })
  //const alarms = cronJobList.filter(x => x.nextDates()[0] > now).map(x => {
  //  let ms = moment(x.nextDates(),"DD/MM/YYYY HH:mm:ss").diff(moment(now,"DD/MM/YYYY HH:mm:ss"));
  //  let d = moment.duration(ms);
  //  if (Math.floor(d.asHours()) > 0) {
  //    return `${Math.floor(d.asHours())} horas y ${moment.utc(ms).format("m")} minutos`
  //  } else {
  //    return `${moment.utc(ms).format("m")} minutos`
  //  }
  //})
  //if (alarms.length > 0) {
  //  RhasspyMopidy.speak(`Dentro de: ${alarms.join(', ')}`);
  //} else {
  //  RhasspyMopidy.speak(`No hay próximas alarmas`);
  //}
}

export function listCurrentAlarms() {
  // const alarms = cronJobList.map(x => x.nextDates().format("dddd h mm a"))
  // if (alarms.length > 0) {
  //   RhasspyMopidy.speak(`Hay alarmas a: ${alarms.join(', ')}`);
  // } else {
  //   RhasspyMopidy.speak(`No hay alarmas programadas`);
  // }
  // return alarms
}
