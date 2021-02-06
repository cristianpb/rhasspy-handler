import { CronJob } from 'cron';
import moment from 'moment';
import 'moment/locale/es';
import { volumeSetSnapcast } from './snapcast';

moment.locale('es');
import { RhasspyMopidy } from './rhasppymopidy';
const rhasspymopidy = new RhasspyMopidy()

let cronJobList: CronJob[] = [];

export function setWakeUpAlarm(hour: number, minutes: number) {
  const job = new CronJob({
    cronTime: `${minutes} ${hour} * * *`,
    onTick: function () {
      rhasspymopidy.volumeSet(2, false);
      volumeSetSnapcast('raspi', 10);
      volumeSetSnapcast('raspicam', 10);
      volumeSetSnapcast('raspimov', 10);
      rhasspymopidy.setPlaylist('café croissant');
      setTimeout(function(){ rhasspymopidy.volumeSet(3, false); }, 60000);
    },
    timeZone: 'Europe/Paris'
  });
  job.start();
  cronJobList.push(job);
  rhasspymopidy.speak(`La alarma sonará a las ${hour} y ${minutes}`);
}

export function deleteAllAlarms() {
  cronJobList.length = 0
  rhasspymopidy.speak(`Alarmas borradas`);
}

export function deleteOneAlarm(day: number, hour: number) {
  const dateAlarm = moment({day: day, hour: hour});
  const filteredAlarms = cronJobList.filter(item => !(item.nextDates().isSame(dateAlarm, 'hour')))
  const deletedCrons = cronJobList.length - filteredAlarms.length;
  if (deletedCrons > 0) {
    rhasspymopidy.speak(`Alarmas borradas ${deletedCrons}`);
    cronJobList = filteredAlarms
  } else {
    rhasspymopidy.speak(`No se borraron alarmas. Hay ${cronJobList.length}`);
  }
 }

export function listNextAlarms() {
  let now = moment()
  const alarms = cronJobList.filter(x => x.nextDates().isAfter(now)).map(x => {
    let ms = moment(x.nextDates(),"DD/MM/YYYY HH:mm:ss").diff(moment(now,"DD/MM/YYYY HH:mm:ss"));
    let d = moment.duration(ms);
    if (Math.floor(d.asHours()) > 0) {
      return `${Math.floor(d.asHours())} horas y ${moment.utc(ms).format("m")} minutos`
    } else {
      return `${moment.utc(ms).format("m")} minutos`
    }
  })
  if (alarms.length > 0) {
    rhasspymopidy.speak(`Dentro de: ${alarms.join(', ')}`);
  } else {
    rhasspymopidy.speak(`No hay próximas alarmas`);
  }
}

export function listCurrentAlarms() {
  const alarms = cronJobList.map(x => x.nextDates().format("dddd h mm a"))
  if (alarms.length > 0) {
    rhasspymopidy.speak(`Hay alarmas a: ${alarms.join(', ')}`);
  } else {
    rhasspymopidy.speak(`No hay alarmas programadas`);
  }
}
