import { parseFeed } from 'htmlparser2';
import * as Path from 'path';
import fs from 'fs';
import axios from 'axios';

export async function downloadPostcast (url: string) {
  const res = await axios(url)
  let feed = parseFeed(res.data, {xmlMode: true, decodeEntities: true});
  console.log('RSS: ', feed.title);

  const dir = process.env.PODCAST_DIR; // '/var/lib/mopidy/media'
  const files = fs
    .readdirSync(dir)
    .map(fileName => {
      return {
        name: fileName,
        time: fs.statSync(dir + '/' + fileName).mtime.getTime()
      };
    })
    .sort((a, b) => b.time - a.time) // Sort decending order
    .map(v => v.name);

  feed.items.slice(0, 5).forEach(async (item: any) => {
    console.log(item)
    // get filename
    let fileName = item.id.split('/').slice(-2).pop();
    if (files.indexOf(fileName) === -1) {
      console.log(`Downloading ${item.title}:${item.id}`);
      await downloadFile(item.id, fileName);
    } else {
      console.log(`Already exists : ${fileName}`);
    }
  });

  // Delete old files
  if (files.length > 5) {
    files.slice(6, files.length).forEach(item => {
      console.log(`Removing ${item}`);
      let path = Path.resolve(dir, item);
      fs.unlinkSync(path);
    });
  }
}

async function downloadFile(id: string, fileName: string) {
  let path = Path.resolve(process.env.PODCAST_DIR, fileName);
  const writer = fs.createWriteStream(path);
  const response = await axios({
    url: id,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
