'use strict';
var path = require('path'),
    Q = require('q'),
    utils = require('../lib/utils'),
    mkdirp = require('mkdirp'),
    concat = require('concat-stream'),
    localizr = require('localizr'),
    fs = require('fs');

function endsWith(str, frag) {
    return str.lastIndexOf(frag) === (str.length - frag.length);
}

function correctPathSeparator(filePath) {
    return filePath.split('/').join(path.sep);

}

module.exports = function(grunt) {
    grunt.registerMultiTask('localizr', 'A preprocessor for Dust.js templates.', function () {
        var done, options, contentPath, bundles, bundleRoot, filesSrc;
        var pathName = path.sep + '**' + path.sep + '*.properties';
        var fileRoot = path.join('public', 'templates'),
            superPromArr = [];
        done = this.async();
        options = this.options({
            fallback: 'en_US',
            contentPath: ['locales'],
            tmpDir: 'tmp'
        });

        contentPath = options.contentPath;
        if (!Array.isArray(contentPath)) {
            contentPath = [contentPath];
        }

        contentPath = contentPath.map(correctPathSeparator);
        filesSrc = this.filesSrc.map(correctPathSeparator);

        contentPath = contentPath.map(function (cp) {
            var regexp = new RegExp('([\\' + path.sep + ']?)$');
            if (!endsWith(cp, pathName)) {
                return cp.replace(regexp, pathName);
            }
            return cp;
        });

        bundleRoot = contentPath.map(function (cp) {
            return cp.replace(pathName, '');
        });

        // TODO: Currently only honors one locale directory.
        bundleRoot = Array.isArray(bundleRoot) ? bundleRoot[0] : bundleRoot;
        bundles = (grunt.file.expand(contentPath)).map(correctPathSeparator);

        //Bundles have the file names
        //filesSrc has the list of files

        //need to use localizr to localize for corresponding files

        filesSrc.forEach(function(srcFile) {
            var fileBundles = [],
                subPromArr = [],
                fileDefer = Q.defer(),
                name = utils.getName(srcFile, 'public/templates') + '.properties';
            superPromArr.push(fileDefer.promise);

            //get the bundles that correspond to this file
            fileBundles = bundles.filter(function(entry) {
               return(entry.indexOf(name) !== -1);
            });


            //localize with each file/bundle combo
            fileBundles.forEach(function(propFile) {
                var destFile = utils.getName(propFile, bundleRoot) + '.dust';
                destFile = path.join(options.tmpDir, destFile);
                subPromArr.push(localize(srcFile, propFile, destFile));
            });

            Q.all(subPromArr).then(function(data){
                fileDefer.resolve();
            });
        });

        Q.all(superPromArr).then(function() {
            done();
        });
    });
};

function localize(srcFile, propFile, destFile) {
    var srcFile = path.join(process.cwd(), srcFile),
        propFile = path.join(process.cwd(), propFile),
        destFile = path.join(process.cwd(), destFile),
        opt = {
            src: srcFile,
            props: propFile
        },
        deferred = Q.defer();

    mkdirp(path.dirname(destFile), function (err) {
        var out;
        if (err) {
            deferred.reject(err);
            return;
        }

        out = concat({ encoding: 'string' }, function (data) {
            fs.writeFile(destFile, data, function (err) {
                if (err) {
                    deferred.reject(err);
                    return;
                }
                deferred.resolve(destFile);
            });
        });

        try {
            localizr.createReadStream(opt).pipe(out);
        } catch (err) {
            deferred.reject(err);
        }

    });
    return deferred.promise;
}
