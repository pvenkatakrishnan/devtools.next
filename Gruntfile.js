'use strict';
var path = require('path');

module.exports = function (grunt) {

    grunt.initConfig({
        localizr: {
            files: ['public/templates/**/*.dust'],
            options: {
                contentPath: ['locales/**/*.properties']
            }
        },
        dustjs: {
            compile: {
                files: [
                    {
                        expand: true,
                        cwd: 'tmp/',
                        src: '**/*.dust',
                        dest: '.build/templates',
                        ext: '.js'
                    }
                ],
                options: {
                    fullname: function (filepath) {
                        var path = require('path'),
                            name = path.basename(filepath, '.dust'),
                            parts = filepath.split(path.sep),
                            fullname = parts.slice(3, -1).concat(name);

                        return fullname.join(path.sep);
                    }
                }
            }
        },
        clean: {
            'tmp': 'tmp',
            'build': '.build/templates'
        },
        watch: {
            dust: {
                files: ['public/**/*.dust', 'locales/**/*.properties'],
                options: {
                    spawn: false
                },
                tasks: ['localizr', 'dustjs']
            }
        }
    });
    grunt.loadNpmTasks('grunt-dustjs');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadTasks('./tasks');
    grunt.registerTask('i18n', ['clean', 'localizr', 'dustjs', 'clean:tmp']);

    grunt.event.on('watch', function (action, filepath) {
        // If the file is a dust file
        if (grunt.file.isMatch(grunt.config('watch.dust.files'), filepath)) {
            var config = {};

            // Override the localizr config
            console.info('ext', path.extname(filepath));
            if (path.extname(filepath) === '.properties') {
                console.info('setting contentFile');
                grunt.config('localizr.options.contentFile', filepath);

            } else {
                grunt.config('localizr.files', [filepath]);
            }
            // var input = filepath;
            // var output = filepath.replace('public/', '.build/').replace('.dust', '.js');

            // config[output] = input;




            //Override the dust config
            //grunt.config('dust.compile.files',)

        }
    });
};