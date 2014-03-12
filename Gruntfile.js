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

        if (grunt.file.isMatch(grunt.config('watch.dust.files'), filepath)) {
            var config = {},
                input,
                output;

            if (path.extname(filepath) === '.properties') {
                //This is the case where properties file is changed

                // Override the localizr config
                grunt.config('localizr.options.contentFile', filepath);

                input = filepath.replace('locales/', 'tmp/').replace('.properties','.dust');
                output = filepath.replace('locales/', '.build/templates/').replace('.properties', '.js');
                config[output] = input;

                //Override the dust config
                grunt.config('dustjs.compile.files', config);

            } else {
                //This is the case where a dust file is changed
                var name = path.basename(filepath);
                //override localizr config
                grunt.config('localizr.files', [filepath]);

                //override dust config
                var conf = grunt.config.get('dustjs.compile.files');
                conf[0].src = path.join('**', name);
                grunt.config.set('dustjs.compile.files', conf);
            }
        }
    });
};