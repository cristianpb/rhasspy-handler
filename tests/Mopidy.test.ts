import { RhasspyMopidy, mopidyClient } from '../src/rhasppymopidy';

const rhasspymopidy = new RhasspyMopidy()
mopidyClient.on('state:online', async () => {
  //rhasspymopidy.volumeUp();
  //rhasspymopidy.volumeSet(15);
  //console.log(mopidyClient.playlists);
  //rhasspymopidy.setPlaylist('café croissant');
  rhasspymopidy.searchArtist('bad bunny')
})

process.on('SIGINT', function () {
  rhasspymopidy.close();
  console.log('Bye, bye!');
	process.exit(0);
});

