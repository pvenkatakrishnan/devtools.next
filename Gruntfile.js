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
        }
    });
    grunt.loadNpmTasks('grunt-dustjs');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadTasks('./tasks');
    grunt.registerTask('i18n', ['clean', 'localizr', 'dustjs', 'clean:tmp']);
};