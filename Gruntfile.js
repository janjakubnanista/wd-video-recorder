'use strict';

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    require('time-grunt')(grunt);

    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                'lib/*.js'
            ]
        },
        shell: {
            test: {
                command: 'mocha --reporter spec --colors test/*.js',
                options: {
                    stdout: true,
                    stderr: true
                }
            }
        }
    });

    grunt.registerTask('test', ['jshint', 'shell:test']);

    grunt.registerTask('default', ['test']);
};
