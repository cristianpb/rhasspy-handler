declare module mopidy {
	interface mopidyOptions {
		webSocketUrl?: string;
		console?: any;
		webSocket?: any;
	}

	interface SearchQuery {
		uri?: string[],
		track_name?: string[],
		album?: string[],
		artist?: string[],
		albumartist?: string[],
		composer?: string[],
		performer?: string[],
		track_no?: string[],
		genre?: string[],
		date?: string[],
		comment?: string[],
		any?: string[]
	}

	namespace Model {
		interface Image {
			__model__: 'Image',
			uri: string,
			width: number,
			height: number
		}

		interface Album {
			__model__: 'Album',
			name: string,
			num_tracks: number,
			uri: string,
			images?: string[],
			artists: Artist[],
			date: string,
			musicbrainz_id: string,
			num_discs: number
		}

		interface Artist {
			__model__: 'Artist',
			musicbrainz_id: string,
			name: string,
			uri: string
		}

		interface Track extends PlaylistTrack {
			length: number,
			track_no: number,
			disc_no: number,
			genre: string,
			musicbrainz_id: string,
			bitrate: number,
			comment: string,
			last_modified: number
			album: Album,
			artists: Artist[]
		}

		interface PlaylistTrack {
			__model__: 'Track',
			uri: string,
			name: string
		}

		interface TlTrack {
			__model__: 'TlTrack',
			track: Track,
			tlid: number
		}

		interface Playlist {
			__model__: 'Playlist',
			name: string,
			uri: string,
			last_modified: number,
			tracks?: PlaylistTrack[]
		}

		interface Ref {
			__model__: 'Ref',
			type: string,
			name: string,
			uri: string
		}

		interface SearchResult {
			__model__: 'SearchResult',
			tracks: Track[] | undefined,
			uri: string
		}
	}

	type PlaybackState = 'paused' | 'stopped' | 'playing';

	interface PlaybackPausedEvent extends PlaybackChangeEvent {
		time_position: number
	}

	interface PlaybackChangeEvent {
		tl_track: {
			track: mopidy.Model.TlTrack
			tlid: number
		}
	}
}

interface mopidyOptions {
  webSocketUrl?: string;
  console?: any;
  webSocket?: any;
}

declare class mopidy {
	constructor(options: mopidyOptions);

    /**
    * Close the WebSocket without reconnecting.
    * Letting the object be garbage collected will have the same effect, so this isn't strictly necessary.
    */
    close(): void;

	on(event: 'socket:open', listener: () => void): void;
	on(event: 'socket:error', listener: (error: ErrorEvent) => void): void;
	on(event: 'state:online', listener: () => void): void;
	on(event: 'event:playbackStateChanged', listener: (message: { old_state: mopidy.PlaybackState, new_state: mopidy.PlaybackState }) => void): void;
	on(event: 'event:trackPlaybackPaused', listener: (message: mopidy.PlaybackPausedEvent) => void): void;
	on(event: 'event:trackPlaybackStarted', listener: (message: mopidy.PlaybackChangeEvent) => void): void;
	on(event: 'event:trackPlaybackEnded', listener: (message: mopidy.PlaybackChangeEvent) => void): void;
	on(event: 'event:volumeChanged', listener: (message: { volume: number }) => void): void;
	on(event: 'event:tracklistChanged', listener: () => void): void;
	on(event: 'event:seeked', listener: (message: { time_position: number }) => void): void;
	on(event: 'event:playlistChanged', listener: (message: { playlist: mopidy.Model.Playlist }) => void): void;
	on(event: 'event:optionsChanged', listener: () => void): void;
	on(event: 'event:streamTitleChanged', listener: (message: { title: string }) => void): void;

    /**
    * Register the listener function to be called when the emitter emits the event.
    */
    on(event: string, listener: (...args: any[]) => void): void;

    /**
    * Remove a previously registered listener function for the specified event. If the function has not previously been registered, it is silently ignored.
    */
    off(event: string, listener: Function): void;
    /**
    * Remove all previously registered listener functions for the specified event. If no functions have previously been registered, it is silently ignored.
    */
    off(event: string): void;
    /**
    * Remove all previously registered listeners on the object, both regular listeners, supervisor listeners, and errbacks. If no functions have previously been registrered, it is silently ignored.
    */
    off(): void;

	tracklist: {
		/**
		* The position of the given track in the tracklist.
		* If neither *tl_track* or *tlid* is given we return the index of
		* the currently playing track.
		* :param tl_track: the track to find the index of
		* :type tl_track: :class:`mopidy.models.TlTrack` or :class:`None`
		* :param tlid: TLID of the track to find the index of
		* :type tlid: :class:`int` or :class:`None`
		* :rtype: :class:`int` or :class:`None`
		* .. versionadded:: 1.1
		*     The *tlid* parameter
		*/
		index(tl_track?: mopidy.Model.TlTrack, tlid?: number): Promise<number | null>;
		
		/**
		* Shuffles the entire tracklist. If ``start`` and ``end`` is given only
		* shuffles the slice ``[start:end]``.
		* Triggers the :meth:`mopidy.core.CoreListener.tracklist_changed` event.
		* :param start: position of first track to shuffle
		* :type start: int or :class:`None`
		* :param end: position after last track to shuffle
		* :type end: int or :class:`None`
		*/
		shuffle(start?: number, end?: number): Promise<void>;
		
		/**
		* The track that will be played if calling
		* :meth:`mopidy.core.PlaybackController.next()`.
		* For normal playback this is the next track in the tracklist. If repeat
		* is enabled the next track can loop around the tracklist. When random is
		* enabled this should be a random track, all tracks should be played once
		* before the tracklist repeats.
		* :param tl_track: the reference track
		* :type tl_track: :class:`mopidy.models.TlTrack` or :class:`None`
		* :rtype: :class:`mopidy.models.TlTrack` or :class:`None`
		*/
		nextTrack(tl_track: mopidy.Model.TlTrack | null): Promise<mopidy.Model.TlTrack | null>;
		
		/**
		* Get random mode.
		* :class:`True`
		*     Tracks are selected at random from the tracklist.
		* :class:`False`
		*     Tracks are played in the order of the tracklist.
		*/
		getRandom(): Promise<boolean>;
		
		/**
		* Get length of the tracklist.
		*/
		getLength(): Promise<number>;
		
		/**
		* The tlid of the track that will be played if calling
		* :meth:`mopidy.core.PlaybackController.next()`.
		* For normal playback this is the next track in the tracklist. If repeat
		* is enabled the next track can loop around the tracklist. When random is
		* enabled this should be a random track, all tracks should be played once
		* before the tracklist repeats.
		* :rtype: :class:`int` or :class:`None`
		* .. versionadded:: 1.1
		*/
		getNextTlid(): Promise<number | null>;
		
		/**
		* Returns the track that will be played if calling
		* :meth:`mopidy.core.PlaybackController.previous()`.
		* For normal playback this is the previous track in the tracklist. If
		* random and/or consume is enabled it should return the current track
		* instead.
		* :param tl_track: the reference track
		* :type tl_track: :class:`mopidy.models.TlTrack` or :class:`None`
		* :rtype: :class:`mopidy.models.TlTrack` or :class:`None`
		*/
		previousTrack(tl_track: mopidy.Model.TlTrack | null): Promise<mopidy.Model.TlTrack | null>;
		
		/**
		* Add tracks to the tracklist.
		* If ``uri`` is given instead of ``tracks``, the URI is looked up in the
		* library and the resulting tracks are added to the tracklist.
		* If ``uris`` is given instead of ``uri`` or ``tracks``, the URIs are
		* looked up in the library and the resulting tracks are added to the
		* tracklist.
		* If ``at_position`` is given, the tracks are inserted at the given
		* position in the tracklist. If ``at_position`` is not given, the tracks
		* are appended to the end of the tracklist.
		* Triggers the :meth:`mopidy.core.CoreListener.tracklist_changed` event.
		* :param tracks: tracks to add
		* :type tracks: list of :class:`mopidy.models.Track` or :class:`None`
		* :param at_position: position in tracklist to add tracks
		* :type at_position: int or :class:`None`
		* :param uri: URI for tracks to add
		* :type uri: string or :class:`None`
		* :param uris: list of URIs for tracks to add
		* :type uris: list of string or :class:`None`
		* :rtype: list of :class:`mopidy.models.TlTrack`
		* .. versionadded:: 1.0
		*     The ``uris`` argument.
		* .. deprecated:: 1.0
		*     The ``tracks`` and ``uri`` arguments. Use ``uris``.
		*/
		add(tracks?: any, at_position?: number, uri?: string, uris?: string[]): Promise<mopidy.Model.TlTrack[]>;
		
		/**
		* The TLID of the track that will be played after the current track.
		* Not necessarily the same TLID as returned by :meth:`get_next_tlid`.
		* :rtype: :class:`int` or :class:`None`
		* .. versionadded:: 1.1
		*/
		getEotTlid(): Promise<number | null>;
		
		/**
		* Set single mode.
		* :class:`True`
		*     Playback is stopped after current song, unless in ``repeat`` mode.
		* :class:`False`
		*     Playback continues after current song.
		*/
		setSingle(value: boolean): Promise<void>;
		
		/**
		* Remove the matching tracks from the tracklist.
		* Uses :meth:`filter()` to lookup the tracks to remove.
		* Triggers the :meth:`mopidy.core.CoreListener.tracklist_changed` event.
		* :param criteria: on or more criteria to match by
		* :type criteria: dict
		* :rtype: list of :class:`mopidy.models.TlTrack` that was removed
		* .. deprecated:: 1.1
		*     Providing the criteria  via ``kwargs``.
		*/
		remove(criteria?: any): Promise<mopidy.Model.TlTrack[]>;
		
		/**
		* Get single mode.
		* :class:`True`
		*     Playback is stopped after current song, unless in ``repeat`` mode.
		* :class:`False`
		*     Playback continues after current song.
		*/
		getSingle(): Promise<boolean>;
		
		/**
		* Set consume mode.
		* :class:`True`
		*     Tracks are removed from the tracklist when they have been played.
		* :class:`False`
		*     Tracks are not removed from the tracklist.
		*/
		setConsume(value: boolean): Promise<void>;
		
		/**
		* Returns the TLID of the track that will be played if calling
		* :meth:`mopidy.core.PlaybackController.previous()`.
		* For normal playback this is the previous track in the tracklist. If
		* random and/or consume is enabled it should return the current track
		* instead.
		* :rtype: :class:`int` or :class:`None`
		* .. versionadded:: 1.1
		*/
		getPreviousTlid(): Promise<number | null>;
		
		/**
		* Returns a slice of the tracklist, limited by the given start and end
		* positions.
		* :param start: position of first track to include in slice
		* :type start: int
		* :param end: position after last track to include in slice
		* :type end: int
		* :rtype: :class:`mopidy.models.TlTrack`
		*/
		slice(start: number, end: number): Promise<mopidy.Model.TlTrack[]>;
		
		/**
		* Get repeat mode.
		* :class:`True`
		*     The tracklist is played repeatedly.
		* :class:`False`
		*     The tracklist is played once.
		*/
		getRepeat(): Promise<boolean>;
		
		/**
		* Get the tracklist version.
		* Integer which is increased every time the tracklist is changed. Is not
		* reset before mopidy is restarted.
		*/
		getVersion(): Promise<number>;
		
		/**
		* Move the tracks in the slice ``[start:end]`` to ``to_position``.
		* Triggers the :meth:`mopidy.core.CoreListener.tracklist_changed` event.
		* :param start: position of first track to move
		* :type start: int
		* :param end: position after last track to move
		* :type end: int
		* :param to_position: new position for the tracks
		* :type to_position: int
		*/
		move(start: number, end: number, to_position: number): Promise<void>;
		
		/**
		* Get consume mode.
		* :class:`True`
		*     Tracks are removed from the tracklist when they have been played.
		* :class:`False`
		*     Tracks are not removed from the tracklist.
		*/
		getConsume(): Promise<boolean>;
		
		/**
		* Get tracklist as list of :class:`mopidy.models.TlTrack`.
		*/
		getTlTracks(): Promise<mopidy.Model.TlTrack[]>;
		
		/**
		* Get tracklist as list of :class:`mopidy.models.Track`.
		*/
		getTracks(): Promise<mopidy.Model.Track[]>;
		
		/**
		* Clear the tracklist.
		* Triggers the :meth:`mopidy.core.CoreListener.tracklist_changed` event.
		*/
		clear(): Promise<void>;
		
		/**
		* Set random mode.
		* :class:`True`
		*     Tracks are selected at random from the tracklist.
		* :class:`False`
		*     Tracks are played in the order of the tracklist.
		*/
		setRandom(value: boolean): Promise<void>;
		
		/**
		* Filter the tracklist by the given criterias.
		* A criteria consists of a model field to check and a list of values to
		* compare it against. If the model field matches one of the values, it
		* may be returned.
		* Only tracks that matches all the given criterias are returned.
		* Examples::
		*     # Returns tracks with TLIDs 1, 2, 3, or 4 (tracklist ID)
		*     filter({'tlid': [1, 2, 3, 4]})
		*     # Returns track with URIs 'xyz' or 'abc'
		*     filter({'uri': ['xyz', 'abc']})
		*     # Returns track with a matching TLIDs (1, 3 or 6) and a
		*     # matching URI ('xyz' or 'abc')
		*     filter({'tlid': [1, 3, 6], 'uri': ['xyz', 'abc']})
		* :param criteria: on or more criteria to match by
		* :type criteria: dict, of (string, list) pairs
		* :rtype: list of :class:`mopidy.models.TlTrack`
		* .. deprecated:: 1.1
		*     Providing the criteria via ``kwargs``.
		*/
		filter(criteria?: any): Promise<mopidy.Model.TlTrack[]>;
		
		/**
		* The track that will be played after the given track.
		* Not necessarily the same track as :meth:`next_track`.
		* :param tl_track: the reference track
		* :type tl_track: :class:`mopidy.models.TlTrack` or :class:`None`
		* :rtype: :class:`mopidy.models.TlTrack` or :class:`None`
		*/
		eotTrack(tl_track: any): Promise<mopidy.Model.TlTrack | null>;
		
		/**
		* Set repeat mode.
		* To repeat a single track, set both ``repeat`` and ``single``.
		* :class:`True`
		*     The tracklist is played repeatedly.
		* :class:`False`
		*     The tracklist is played once.
		*/
		setRepeat(value: boolean): Promise<void>;	
	}

	mixer: {
		/**
		* Set mute state.
		* :class:`True` to mute, :class:`False` to unmute.
		* Returns :class:`True` if call is successful, otherwise :class:`False`.
		*/
		setMute(mute: boolean): Promise<boolean>;
		
		/**
		* Get the volume.
		* Integer in range [0..100] or :class:`None` if unknown.
		* The volume scale is linear.
		*/
		getVolume(): Promise<number | null>;
		
		/**
		* Get mute state.
		* :class:`True` if muted, :class:`False` unmuted, :class:`None` if
		* unknown.
		*/
		getMute(): Promise<boolean | null>;
		
		/**
		* Set the volume.
		* The volume is defined as an integer in range [0..100].
		* The volume scale is linear.
		* Returns :class:`True` if call is successful, otherwise :class:`False`.
		*/
		setVolume(volume: number): Promise<boolean>;
	}

	playback: {
		/**
		* Seeks to time position given in milliseconds.
		* :param time_position: time position in milliseconds
		* :type time_position: int
		* :rtype: :class:`True` if successful, else :class:`False`
		*/
		seek(time_position: number): Promise<boolean>;
		
		/**
		* Pause playback.
		*/
		pause(): Promise<void>;
		
		/**
		* Set the playback state.
		* Must be :attr:`PLAYING`, :attr:`PAUSED`, or :attr:`STOPPED`.
		* Possible states and transitions:
		* .. digraph:: state_transitions
		*     "STOPPED" -> "PLAYING" [ label="play" ]
		*     "STOPPED" -> "PAUSED" [ label="pause" ]
		*     "PLAYING" -> "STOPPED" [ label="stop" ]
		*     "PLAYING" -> "PAUSED" [ label="pause" ]
		*     "PLAYING" -> "PLAYING" [ label="play" ]
		*     "PAUSED" -> "PLAYING" [ label="resume" ]
		*     "PAUSED" -> "STOPPED" [ label="stop" ]
		*/
		setState(new_state: mopidy.PlaybackState): Promise<void>;
		
		/**
		* Get The playback state.
		*/
		getState(): Promise<mopidy.PlaybackState>;
		
		/**
		* Play the given track, or if the given tl_track and tlid is
		* :class:`None`, play the currently active track.
		* Note that the track **must** already be in the tracklist.
		* :param tl_track: track to play
		* :type tl_track: :class:`mopidy.models.TlTrack` or :class:`None`
		* :param tlid: TLID of the track to play
		* :type tlid: :class:`int` or :class:`None`
		*/
		play(tl_track?: mopidy.Model.TlTrack, tlid?: number): Promise<void>;
		
		/**
		* Get the current stream title or :class:`None`.
		*/
		getStreamTitle(): Promise<string | null>;
		
		/**
		* Get the currently playing or selected TLID.
		* Extracted from :meth:`get_current_tl_track` for convenience.
		* Returns a :class:`int` or :class:`None`.
		* .. versionadded:: 1.1
		*/
		getCurrentTlid(): Promise<number | null>;
		
		/**
		* Get the currently playing or selected track.
		* Returns a :class:`mopidy.models.TlTrack` or :class:`None`.
		*/
		getCurrentTlTrack(): Promise<mopidy.Model.TlTrack | null>;
		
		/**
		* Change to the next track.
		* The current playback state will be kept. If it was playing, playing
		* will continue. If it was paused, it will still be paused, etc.
		*/
		next(): Promise<void>;
		
		/**
		* Get the currently playing or selected track.
		* Extracted from :meth:`get_current_tl_track` for convenience.
		* Returns a :class:`mopidy.models.Track` or :class:`None`.
		*/
		getCurrentTrack(): Promise<mopidy.Model.Track | null>;
		
		/**
		* Stop playing.
		*/
		stop(): Promise<void>;
		
		/**
		* If paused, resume playing the current track.
		*/
		resume(): Promise<void>;
		
		/**
		* Get time position in milliseconds.
		*/
		getTimePosition(): Promise<number>;
		
		/**
		* Change to the previous track.
		* The current playback state will be kept. If it was playing, playing
		* will continue. If it was paused, it will still be paused, etc.
		*/
		previous(): Promise<void>;
	}

	library: {
		/**
		* Lookup the given URIs.
		* If the URI expands to multiple tracks, the returned list will contain
		* them all.
		* :param uri: track URI
		* :type uri: string or :class:`None`
		* :param uris: track URIs
		* :type uris: list of string or :class:`None`
		* :rtype: list of :class:`mopidy.models.Track` if uri was set or
		*     {uri: list of :class:`mopidy.models.Track`} if uris was set.
		* .. versionadded:: 1.0
		*     The ``uris`` argument.
		* .. deprecated:: 1.0
		*     The ``uri`` argument. Use ``uris`` instead.
		*/
		lookup(uri: string): Promise<mopidy.Model.TlTrack[]>;
		/**
		* Lookup the given URIs.
		* If the URI expands to multiple tracks, the returned list will contain
		* them all.
		* :param uri: track URI
		* :type uri: string or :class:`None`
		* :param uris: track URIs
		* :type uris: list of string or :class:`None`
		* :rtype: list of :class:`mopidy.models.Track` if uri was set or
		*     {uri: list of :class:`mopidy.models.Track`} if uris was set.
		* .. versionadded:: 1.0
		*     The ``uris`` argument.
		* .. deprecated:: 1.0
		*     The ``uri`` argument. Use ``uris`` instead.
		*/
		lookup(uri: undefined, uris: string[]): Promise<{[uri:string]: mopidy.Model.TlTrack[]}>;
		
		/**
		* List distinct values for a given field from the library.
		* This has mainly been added to support the list commands the MPD
		* protocol supports in a more sane fashion. Other frontends are not
		* recommended to use this method.
		* :param string field: One of ``track``, ``artist``, ``albumartist``,
		*     ``album``, ``composer``, ``performer``, ``date`` or ``genre``.
		* :param dict query: Query to use for limiting results, see
		*     :meth:`search` for details about the query format.
		* :rtype: set of values corresponding to the requested field type.
		* .. versionadded:: 1.0
		*/
		getDistinct(field: 'track'|'artist'|'albumartist'|'album'|'composer'|'performer'|'date'|'genre', query?: mopidy.SearchQuery): Promise<any>;
		
		/**
		* Refresh library. Limit to URI and below if an URI is given.
		* :param uri: directory or track URI
		* :type uri: string
		*/
		refresh(uri?: string): Promise<void>;
		
		/**
		* Browse directories and tracks at the given ``uri``.
		* ``uri`` is a string which represents some directory belonging to a
		* backend. To get the intial root directories for backends pass
		* :class:`None` as the URI.
		* Returns a list of :class:`mopidy.models.Ref` objects for the
		* directories and tracks at the given ``uri``.
		* The :class:`~mopidy.models.Ref` objects representing tracks keep the
		* track's original URI. A matching pair of objects can look like this::
		*     Track(uri='dummy:/foo.mp3', name='foo', artists=..., album=...)
		*     Ref.track(uri='dummy:/foo.mp3', name='foo')
		* The :class:`~mopidy.models.Ref` objects representing directories have
		* backend specific URIs. These are opaque values, so no one but the
		* backend that created them should try and derive any meaning from them.
		* The only valid exception to this is checking the scheme, as it is used
		* to route browse requests to the correct backend.
		* For example, the dummy library's ``/bar`` directory could be returned
		* like this::
		*     Ref.directory(uri='dummy:directory:/bar', name='bar')
		* :param string uri: URI to browse
		* :rtype: list of :class:`mopidy.models.Ref`
		* .. versionadded:: 0.18
		*/
		browse(uri: string): Promise<mopidy.Model.Ref[]>;
		
		/**
		* Search the library for tracks where ``field`` contains ``values``.
		* ``field`` can be one of ``uri``, ``track_name``, ``album``, ``artist``,
		* ``albumartist``, ``composer``, ``performer``, ``track_no``, ``genre``,
		* ``date``, ``comment`` or ``any``.
		* If ``uris`` is given, the search is limited to results from within the
		* URI roots. For example passing ``uris=['file:']`` will limit the search
		* to the local backend.
		* Examples::
		*     # Returns results matching 'a' in any backend
		*     search({'any': ['a']})
		*     # Returns results matching artist 'xyz' in any backend
		*     search({'artist': ['xyz']})
		*     # Returns results matching 'a' and 'b' and artist 'xyz' in any
		*     # backend
		*     search({'any': ['a', 'b'], 'artist': ['xyz']})
		*     # Returns results matching 'a' if within the given URI roots
		*     # "file:///media/music" and "spotify:"
		*     search({'any': ['a']}, uris=['file:///media/music', 'spotify:'])
		*     # Returns results matching artist 'xyz' and 'abc' in any backend
		*     search({'artist': ['xyz', 'abc']})
		* :param query: one or more queries to search for
		* :type query: dict
		* :param uris: zero or more URI roots to limit the search to
		* :type uris: list of string or :class:`None`
		* :param exact: if the search should use exact matching
		* :type exact: :class:`bool`
		* :rtype: list of :class:`mopidy.models.SearchResult`
		* .. versionadded:: 1.0
		*     The ``exact`` keyword argument, which replaces :meth:`find_exact`.
		* .. deprecated:: 1.0
		*     Previously, if the query was empty, and the backend could support
		*     it, all available tracks were returned. This has not changed, but
		*     it is strongly discouraged. No new code should rely on this
		*     behavior.
		* .. deprecated:: 1.1
		*     Providing the search query via ``kwargs`` is no longer supported.
		*/
		search(query?: mopidy.SearchQuery, uris?: string[], exact?: boolean): Promise<mopidy.Model.SearchResult[]>;
		
		/**
		* Lookup the images for the given URIs
		* Backends can use this to return image URIs for any URI they know about
		* be it tracks, albums, playlists. The lookup result is a dictionary
		* mapping the provided URIs to lists of images.
		* Unknown URIs or URIs the corresponding backend couldn't find anything
		* for will simply return an empty list for that URI.
		* :param uris: list of URIs to find images for
		* :type uris: list of string
		* :rtype: {uri: tuple of :class:`mopidy.models.Image`}
		* .. versionadded:: 1.0
		*/
		getImages(uris: string[]): Promise<{[uri: string]: mopidy.Model.Image[]}>;
		
	}

	playlists: {
		/**
		* Save the playlist.
		* For a playlist to be saveable, it must have the ``uri`` attribute set.
		* You must not set the ``uri`` atribute yourself, but use playlist
		* objects returned by :meth:`create` or retrieved from :attr:`playlists`,
		* which will always give you saveable playlists.
		* The method returns the saved playlist. The return playlist may differ
		* from the saved playlist. E.g. if the playlist name was changed, the
		* returned playlist may have a different URI. The caller of this method
		* must throw away the playlist sent to this method, and use the
		* returned playlist instead.
		* If the playlist's URI isn't set or doesn't match the URI scheme of a
		* current backend, nothing is done and :class:`None` is returned.
		* :param playlist: the playlist
		* :type playlist: :class:`mopidy.models.Playlist`
		* :rtype: :class:`mopidy.models.Playlist` or :class:`None`
		*/
		save(playlist: any): Promise<mopidy.Model.Playlist | null>;
		
		/**
		* Refresh the playlists in :attr:`playlists`.
		* If ``uri_scheme`` is :class:`None`, all backends are asked to refresh.
		* If ``uri_scheme`` is an URI scheme handled by a backend, only that
		* backend is asked to refresh. If ``uri_scheme`` doesn't match any
		* current backend, nothing happens.
		* :param uri_scheme: limit to the backend matching the URI scheme
		* :type uri_scheme: string
		*/
		refresh(uri_scheme?: string): Promise<void>;
		
		/**
		* Lookup playlist with given URI in both the set of playlists and in any
		* other playlist sources. Returns :class:`None` if not found.
		* :param uri: playlist URI
		* :type uri: string
		* :rtype: :class:`mopidy.models.Playlist` or :class:`None`
		*/
		lookup(uri: string): Promise<any>;
		
		/**
		* Delete playlist identified by the URI.
		* If the URI doesn't match the URI schemes handled by the current
		* backends, nothing happens.
		* :param uri: URI of the playlist to delete
		* :type uri: string
		*/
		delete(uri: string): Promise<void>;
		
		/**
		* Create a new playlist.
		* If ``uri_scheme`` matches an URI scheme handled by a current backend,
		* that backend is asked to create the playlist. If ``uri_scheme`` is
		* :class:`None` or doesn't match a current backend, the first backend is
		* asked to create the playlist.
		* All new playlists must be created by calling this method, and **not**
		* by creating new instances of :class:`mopidy.models.Playlist`.
		* :param name: name of the new playlist
		* :type name: string
		* :param uri_scheme: use the backend matching the URI scheme
		* :type uri_scheme: string
		* :rtype: :class:`mopidy.models.Playlist` or :class:`None`
		*/
		create(name: string, uri_scheme?: string): Promise<mopidy.Model.Playlist | null>;
		
		/**
		* Get the list of URI schemes that support playlists.
		* :rtype: list of string
		* .. versionadded:: 2.0
		*/
		getUriSchemes(): Promise<string[]>;
		
		/**
		* Get the items in a playlist specified by ``uri``.
		* Returns a list of :class:`~mopidy.models.Ref` objects referring to the
		* playlist's items.
		* If a playlist with the given ``uri`` doesn't exist, it returns
		* :class:`None`.
		* :rtype: list of :class:`mopidy.models.Ref`, or :class:`None`
		* .. versionadded:: 1.0
		*/
		getItems(uri: string): Promise<mopidy.Model.Ref[]>;
		
		/**
		* Get a list of the currently available playlists.
		* Returns a list of :class:`~mopidy.models.Ref` objects referring to the
		* playlists. In other words, no information about the playlists' content
		* is given.
		* :rtype: list of :class:`mopidy.models.Ref`
		* .. versionadded:: 1.0
		*/
		asList(): Promise<mopidy.Model.Ref[]>;
	}

	history: {
		/**
		* Get the number of tracks in the history.
		* :returns: the history length
		* :rtype: int
		*/
		getLength(): Promise<number>;
		
		/**
		* Get the track history.
		* The timestamps are milliseconds since epoch.
		* :returns: the track history
		* :rtype: list of (timestamp, :class:`mopidy.models.Ref`) tuples
		*/
		getHistory(): Promise<[number, mopidy.Model.Ref][]>;	
	}
}

declare module 'mopidy' {
    export default mopidy;
}
