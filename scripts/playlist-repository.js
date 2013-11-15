require([
    '$api/models',
    '$api/search',
    '$views/list#List'
], function (models, search, List) {
    'use strict';

    function sanitiseXmlString(xmlText) {
        return xmlText.replace(/(&(?!amp;))/g, "&amp;");
    }

    var showPlaylist = function () {
        var xmlHttpRequest = new XMLHttpRequest()
        xmlHttpRequest.open('GET', 'http://airnet.org.au/program/javascriptEmbed.php?episode=58447&helperStart=http%3A%2F%2Fwww.rrr.org.au&view=3', true);
        xmlHttpRequest.send();
        xmlHttpRequest.onreadystatechange = function () {
            if (xmlHttpRequest.readyState == 4 && xmlHttpRequest.status == 200) {

                models.Playlist.createTemporary("Triple R").done(function (playlist) {
                    playlist.load("tracks").done(function (loadedPlaylist) {

                        var $xml = $(new DOMParser().parseFromString(sanitiseXmlString(xmlHttpRequest.responseText), 'text/xml'));

                        $xml.find(".playlist-track").children().not(".trackId").not(".noTrackContent").each(function () {

                            var artistAndTrack = $(this).text().split("-", 2);
                            var artistName = artistAndTrack[0].trim();
                            var trackName = artistAndTrack[1].trim();
                            console.log('Artist: ' + artistName + ', Track: ' + trackName);

                            var searchResults = search.Search.search('artist:"' + artistName + '"+track:"' + trackName + '"');
                            searchResults.tracks.snapshot(0, 1).done(function (snapshot) {
                                snapshot.loadAll('name').done(function (tracks) {
                                    tracks.forEach(function (track) {
                                        console.log(track.name, track.uri);

                                        var artistMatch = false;
                                        for (var idx = 0; idx < track.artists.length; idx++) {
                                            if (track.artists[idx].name.toLowerCase() == artistName.toLowerCase()) {
                                                artistMatch = true;
                                                break;
                                            }
                                        }

                                        if (artistMatch) {
                                            loadedPlaylist.tracks.add(track);
                                        }
                                    });
                                });
                            });
                        });
                    });

                    var list = List.forPlaylist(playlist);
                    document.getElementById('playlistContainer1').appendChild(list.node);
                    list.init();
                });
            }
        }
    };

    exports.showPlaylist = showPlaylist;
});