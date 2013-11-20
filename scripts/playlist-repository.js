require([
    '$api/models',
    '$api/search',
    '$views/list#List'
], function (models, search, List) {
    'use strict';

    function sanitiseXmlString(xmlText) {
        return xmlText.replace(/(&(?!amp;))/g, "&amp;");
    }

    function parsePlaylistTracksFromAmrapResponse(xml) {
        var playlistTracks = [];
        xml.find(".playlist-track").children().not(".trackId").not(".noTrackContent").each(function () {
            var artistAndTrack = $(this).text().split("-", 2);
            var artistName = artistAndTrack[0].trim();
            var trackName = artistAndTrack[1].trim();
            console.log('Artist: ' + artistName + ', Track: ' + trackName);
            playlistTracks.push({ "artistName": artistName, "trackName": trackName})
        });
        return playlistTracks;
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

    function isArtistNameInArtists(artistName, artistArray) {
        var artistMatch = false;
        for (var idx = 0; idx < artistArray.length; idx++) {
            if (artistArray[idx].name.toLowerCase() == artistName.toLowerCase()) {
                artistMatch = true;
                break;
            } else {
                console.log('Artist did not match. Expected [' + artistName + '] but found [' + artistArray[idx].name + ']');
            }
        }
        return artistMatch;
    }

    function findFirstSpotifyMatch(playlistTrack, callback) {
        var searchResults = search.Search.search('artist:"' + playlistTrack.artistName + '"+track:"' + playlistTrack.trackName + '"');

        searchResults.tracks.snapshot(0, 1).done(function (snapshot) {
            if (snapshot.length > 0) {
                snapshot.loadAll('name').done(function (tracks) {
                    tracks.forEach(function (track) {
                        console.log(track.name, track.uri);

                        if (isArtistNameInArtists(playlistTrack.artistName, track.artists)) {
                            callback(track);
                        } else {
                            callback();
                        }
                    });
                });
            } else {
                callback();
            }
        });
    }

    function displayPlaylist(loadedPlaylist) {
        var list = List.forCollection(loadedPlaylist.tracks.sort('name'));
        document.getElementById('playlistContainer1').appendChild(list.node);
        list.init();
    }

    var showPlaylist = function () {
        var xmlHttpRequest = new XMLHttpRequest()
        xmlHttpRequest.open('GET', 'http://airnet.org.au/program/javascriptEmbed.php?episode=58447&helperStart=http%3A%2F%2Fwww.rrr.org.au&view=3', true);
        xmlHttpRequest.send();
        xmlHttpRequest.onreadystatechange = function () {
            if (xmlHttpRequest.readyState == 4 && xmlHttpRequest.status == 200) {
                models.Playlist.createTemporary("Triple R").done(function (playlist) {
                    playlist.load("tracks").done(function (loadedPlaylist) {
                        loadedPlaylist.tracks.snapshot().done(function (tracksSnapshot) {
                            if (tracksSnapshot.length == 0) {
                                var $xml = $(new DOMParser().parseFromString(sanitiseXmlString(xmlHttpRequest.responseText), 'text/xml'));

                                var playlistTracks = parsePlaylistTracksFromAmrapResponse($xml);

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
                                        displayPlaylist(loadedPlaylist);
                                    }
                                );
                            } else {
                                displayPlaylist(loadedPlaylist);
                            }
                        });
                    });
                });
            }
        }
    };

    exports.showPlaylist = showPlaylist;
});