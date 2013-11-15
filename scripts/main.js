require([
    '$api/models',
    'scripts/language-example',
    'scripts/cover-example',
    'scripts/button-example',
    'scripts/playlist-example',
    'scripts/playlist-repository'
], function (models, languageExample, coverExample, buttonExample, playlistExample, playlistRepository) {
    'use strict';

//    languageExample.doHelloWorld();
//    coverExample.doCoverForAlbum();
//    buttonExample.doShareButtonForArtist();
//    buttonExample.doPlayButtonForAlbum();
//    playlistExample.doPlaylistForAlbum();
    playlistRepository.showPlaylist();

});
