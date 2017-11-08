module.exports = function (grunt) {
    'use strict';

    var sass    = grunt.config('sass') || {};
    var watch   = grunt.config('watch') || {};
    var notify  = grunt.config('notify') || {};
    var root    = grunt.option('root') + '/pciSamples/views/';

    sass.pcisamples = {
        options : {},
        files : {}
    };
    sass.pcisamples.files[root + 'js/pciCreator/dev/textReaderInteraction/creator/css/textReaderInteraction.css'] = root + 'js/pciCreator/dev/textReaderInteraction/creator/scss/textReaderInteraction.scss';
    sass.pcisamples.files[root + 'js/pciCreator/dev/textReaderInteraction/runtime/css/textReaderInteraction.css'] = root + 'js/pciCreator/dev/textReaderInteraction/runtime/scss/textReaderInteraction.scss';

    watch.pcisamplessass = {
        files : [
            root + 'scss/**/*.scss',
            root + 'js/pciCreator/dev/**/*.scss'
        ],
        tasks : ['sass:pcisamples', 'notify:pcisamplessass'],
        options : {
            debounceDelay : 1000
        }
    };

    notify.pcisamplessass = {
        options: {
            title: 'Grunt SASS',
            message: 'SASS files compiled to CSS'
        }
    };

    grunt.config('sass', sass);
    grunt.config('watch', watch);
    grunt.config('notify', notify);

    grunt.registerTask('pcisamplessass', ['sass:pcisamples']);
};