angular.module('triplerApp').factory('spotifyService', function ($http) {

    var service = {};

    service.findOrCreateTemporaryPlaylist = function (playlist, createPlaylistComplete) {
        spotify.require(['$api/search', '$api/models'], function (search, models) {

            var playlistName = playlist.program + ' - ' + playlist.date,
                playlistTracks = playlist.tracks;

            models.Playlist.createTemporary(playlistName).done(function (spotifyPlaylist) {
                spotifyPlaylist.load("tracks").done(function (loadedPlaylist) {
                    loadedPlaylist.tracks.snapshot().done(function (tracksSnapshot) {
                        if (tracksSnapshot.length === 0) {
                            parallelizeTasks(playlistTracks,
                                function (playlistTrack, callback) {
                                    findFirstSpotifyMatch(playlistTrack, function (track) {
                                        if (track) {
                                            loadedPlaylist.tracks.add(track);
                                        }

                                        callback();
                                    });
                                },
                                function () {
                                    createPlaylistComplete(loadedPlaylist);
                                }
                            );
                        } else {
                            createPlaylistComplete(loadedPlaylist);
                        }
                    });
                });
            });


            function findFirstSpotifyMatch(playlistTrack, callback) {
                console.log('artist:"' + playlistTrack.artist + '"+track:"' + playlistTrack.name + '"');
                var searchResults = search.Search.search('artist:"' + playlistTrack.artist + '"+track:"' + playlistTrack.name + '"');

                searchResults.tracks.snapshot(0, 1).done(function (snapshot) {
                    if (snapshot.length > 0) {
                        snapshot.loadAll('name').done(function (tracks) {
                            tracks.forEach(function (track) {
                                console.log(track.name, track.uri);
                                callback(track);
                            });
                        });
                    } else {
                        callback();
                    }
                });
            }
        });
    };

    service.createPlaylistFromTempPlaylist = function (tempPlaylist) {
        spotify.require(['$api/search', '$api/models'], function (search, models) {

            models.Playlist.create(tempPlaylist.name).done(function (playlist) {
                playlist.load("tracks").done(function (playlist) {
                    tempPlaylist.tracks.snapshot().done(function (snapshot) {
                        playlist.tracks.add(snapshot.toArray());
                    });
                });
            });
        });
    }

    function parallelizeTasks(arr, fn, done) {
        var total = arr.length,
            doneTask = function () {
                if (--total === 0) {
                    done();
                }
            };

        arr.forEach(function (value) {
            fn(value, doneTask);
        });
    }

    return service;
});