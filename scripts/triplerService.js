angular.module('triplerApp').factory('triplerService', function ($http) {

    var service = {};

    service.findPrograms = function (callback) {
        $http({method: 'GET', url: 'http://www.rrr.org.au/programs/program-guide/'}).
            success(function (data, status, headers, config) {
                console.log('Program guide success');
                var $xml = $(new DOMParser().parseFromString(sanitiseHtmlText(data), 'text/xml'));
                var programs = parseProgramsFromAmrapResponse($xml);
                callback(programs);
            }).
            error(function (data, status, headers, config) {
                console.log('Program guide error. Status=' + status);
                callback();
            });
    };

    service.findCurrentPlaylist = function (program, callback) {
        $http({method: 'GET', url: 'http://airnet.org.au/program/javascriptEmbed.php?station=4&rpid=' + program.key + '&view=3&helperStart=http%3A%2F%2Fwww.rrr.org.au'}).
            success(function (data, status, headers, config) {
                console.log('Program playlist success');
                var $xml = $(new DOMParser().parseFromString(sanitiseHtmlText(data), 'text/xml'));
                var playlist = {};
                playlist.program = program.name;
                playlist.date = parsePlaylistDateFromAmrapResponse($xml);
                playlist.tracks = parsePlaylistTracksFromAmrapResponse($xml);
                callback(playlist);
            }).
            error(function (data, status, headers, config) {
                console.log('Program playlist error. Status=' + status);
                callback();
            });
    };

    function sanitiseHtmlText(htmlText) {
        return htmlText.replace(/(&(?!amp;))/g, "&amp;");
    }

    function parseProgramsFromAmrapResponse(xml) {
        var programs = [];
        xml.find(".programsList").find("#list").children().each(function () {
            if ($(this).attr('value') != "0" && $(this).attr('value') != "-1") {
                var programName = $(this).text();
                programs.push({'name': programName, 'key': $(this).attr('value')});
            }
        });
        return programs;
    }

    function parsePlaylistDateFromAmrapResponse(xml) {
        return xml.find('a.programTime-main').text();
    }

    function parsePlaylistTracksFromAmrapResponse(xml) {
        var playlistTracks = [];
        xml.find(".playlist-track").children().not(".trackId").not(".noTrackContent").not(".trackContent").each(function () {
            var artistAndTrackText;

            if ($(this).find('a').length > 0) {
                artistAndTrackText = $(this).find('a').text();
            } else {
                artistAndTrackText = $(this).text();
            }

            var artistAndTrack = artistAndTrackText.split("-", 2);
            var artistName = artistAndTrack[0].trim();
            var trackName = artistAndTrack[1].trim();
            console.log('Artist: ' + artistName + ', Track: ' + trackName);
            playlistTracks.push({ "artist": artistName, "name": trackName})
        });
        return playlistTracks;
    }

    return service;
});