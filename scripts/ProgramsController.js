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
            els = angular.element.find('#playlist-wrapper');
        if (els && els.length == 1) {
            listWrapper = els[0];
        }
        return listWrapper;
    }

    function findPlaylistButtons() {
        var el,
            els = angular.element.find('#playlist-buttons');
        if (els && els.length == 1) {
            el = els[0];
        }
        return el;
    }

    function clearPlaylist() {
        $scope.playlistName = '';
        $scope.playlistTracks = [];

        var listButtons = findPlaylistButtons();
        if (listButtons.hasChildNodes()) {
            for (var i = (listButtons.childNodes.length - 1); i >=0; i--) {
                listButtons.removeChild(listButtons.childNodes[i]);
            }
        }

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
                        var addAsPlaylistButton = Button.withLabel('Save playlist');
                        addAsPlaylistButton.addEventListener('click', function(event) {
                            spotifyService.createPlaylistFromTempPlaylist(spotifyPlaylist);
                        });

                        var listButtons = findPlaylistButtons();
                        listButtons.appendChild(addAsPlaylistButton.node);

                        var list = List.forCollection(spotifyPlaylist.tracks.sort('name'));
                        var listWrapper = findPlaylistWrapper();
                        listWrapper.appendChild(list.node);
                        list.init();
                    });
                });
            }
        });
    });
}