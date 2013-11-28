function ProgramsController($scope, triplerService, spotifyService) {

    'use strict';

    $scope.programs = [];

    $scope.selectedProgram = {};

    $scope.playlistName = '';

    $scope.playlistTracks = [];

    triplerService.findPrograms(function (programs) {
        $scope.programs = programs;
    });

    function findPlaylistWrapper() {
        var listWrapper,
            els = angular.element.find('#the-playlist');
        if (els && els.length == 1) {
            listWrapper = els[0];
        }
        return listWrapper;
    }

    function clearPlaylist() {
        $scope.playlistName = '';
        $scope.playlistTracks = [];

        var listWrapper = findPlaylistWrapper();
        if (listWrapper.hasChildNodes()) {
            for (var i = (listWrapper.childNodes.length - 1); i >= 0; i--) {
                listWrapper.removeChild(listWrapper.childNodes[i]);
            }
        }
    }

    $scope.$watch('selectedProgram', function (newProgram, oldProgram, scope) {
        clearPlaylist();

        triplerService.findCurrentPlaylist(newProgram, function (rrrPlaylist) {
            if (rrrPlaylist && rrrPlaylist.tracks && rrrPlaylist.tracks.length > 0) {
                $scope.playlistName = rrrPlaylist.program + ' - ' + rrrPlaylist.date;
                $scope.playlistTracks = rrrPlaylist.tracks;

                spotifyService.findOrCreateTemporaryPlaylist(rrrPlaylist, function (spotifyPlaylist) {
                    spotify.require(['$views/list#List', '$views/buttons#Button'], function (List, Button) {
                        var addAsPlaylistButton = Button.withLabel('Add as Playlist');
                        addAsPlaylistButton.addEventListener('click', function(event) {
                            spotifyService.createPlaylistFromTempPlaylist(spotifyPlaylist);
                        });

                        var list = List.forCollection(spotifyPlaylist.tracks.sort('name'));

                        var listWrapper = findPlaylistWrapper();
                        listWrapper.appendChild(addAsPlaylistButton.node);
                        listWrapper.appendChild(list.node);
                        list.init();
                    });
                });
            }
        });
    });
}