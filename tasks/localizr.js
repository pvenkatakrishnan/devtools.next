'use strict';
var path = require('path'),
    Q = require('q'),
    utils = require('../lib/utils'),
    mkdirp = require('mkdirp'),
    concat = require('concat-stream'),
    localizr = require('localizr'),
    fs = require('fs'),
    logger;

function endsWith(str, frag) {
    return str.lastIndexOf(frag) === (str.length - frag.length);
}

function correctPathSeparator(filePath) {
    return filePath.split('/').join(path.sep);

}

module.exports = function(grunt) {
    logger = grunt.log;
    grunt.registerMultiTask('localizr', 'A preprocessor for Dust.js templates.', function () {
        var done, options, contentPath, bundles, bundleRoot, filesSrc,
            pathName = path.sep + '**' + path.sep + '*.properties',
            fileRoot = path.join('public', 'templates'),
            propFile = this.options().contentFile,
            promise;

        done = this.async();

        options = this.options({
            fallback: 'en_US',
            contentPath: ['locales'],
            fileRoot: fileRoot,
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

        //property file changed
        if (propFile) {
            promise = processPropFileChanged(propFile, fileRoot, bundleRoot, options);
            promise.then(done);
        } else {
            bundles = (grunt.file.expand(contentPath)).map(correctPathSeparator);

            Q.all(filesSrc.map(function(srcFile) {
                return processSrcDust(srcFile, bundles, bundleRoot, options);
            })).then(done);
        }
    });
};

function processPropFileChanged(propFile, fileRoot, bundleRoot, options) {
    var deferred = Q.defer();
    utils.genNameWithProp(propFile, fileRoot, bundleRoot, function(err, fileInfo) {
        var srcFile,
            destFile;

        if (err) {
            logger.err([err]);
            done();
            return;
        }

        destFile = utils.genFilePath(options.tmpDir, fileInfo, 'dust');
        fileInfo.locale = undefined;
        srcFile = utils.genFilePath(fileRoot, fileInfo, 'dust');

        var promise = localize(srcFile, propFile, destFile);
        promise.then(function() {
            deferred.resolve();
        });
    });
    return deferred.promise;
}

function processSrcDust(srcFile, bundles, bundleRoot, options) {
    var deferred = Q.defer(),
        fileBundles,
        name = utils.getName(srcFile, options.fileRoot),
        propName = name + '.properties',
        dustPromises = [];

    //get the bundles that correspond to this file
    fileBundles = bundles.filter(function(entry) {
        return(entry.indexOf(propName) !== -1);
    });

    if (fileBundles.length === 0) {
        dustPromises = dustPromises.concat(processWhenNoBundles(bundles, bundleRoot, srcFile, name, options));

    } else {
        dustPromises = dustPromises.concat(processWithBundles(srcFile, fileBundles, bundleRoot, options));
    }
    Q.all(dustPromises).then(function() {
        deferred.resolve();
    });

    return deferred.promise;
}

function processWhenNoBundles(bundles, bundleRoot, srcFile, name, options) {
    return bundles.map(function(entry){
            var arr = entry.split(path.sep);
            arr.pop();
            arr.shift();
            if(arr.length > 2) {
                arr = arr.slice(0,2);
            }
            return arr.join(path.sep);
        }).filter(function(entry, index, self) {
            return (self.indexOf(entry) === index);
        }).map(function(entry) {
            var destFile = path.join(process.cwd(), options.tmpDir, entry, name + '.dust');
            return copy(srcFile, destFile);
        });
}

function processWithBundles(srcFile, fileBundles, bundleRoot, options) {
    //localize with each file/bundle combo
    return fileBundles.map(function(propFile) {
        var destFile = utils.getName(propFile, bundleRoot) + '.dust';
        destFile = path.join(options.tmpDir, destFile);
        return localize(srcFile, propFile, destFile);
    });
}

function localize(srcFile, propFile, destFile) {

    var srcFile = path.join(process.cwd(), srcFile),
        propFile = path.join(process.cwd(), propFile),
        destFile = path.join(process.cwd(), destFile),
        opt = {
            src: srcFile,
            props: propFile
        },
        deferred = Q.defer();

    mkdirp(path.dirname(destFile), function(err){
        if (err) {
            deferred.reject(err);
            return;
        }
        var out = concat({ encoding: 'string' }, function (data) {
            fs.writeFile(destFile, data, function (err) {
                if (err) {
                    deferred.reject(err);
                    return;
                }
                logger.write('Generated ', destFile, '\n');
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

function copy(srcFile, destFile) {
   var deferred = Q.defer();
    mkdirp(path.dirname(destFile), function(err) {
        if (err) {
            deferred.reject(err);
            return;
        }
        fs.createReadStream(srcFile).pipe(fs.createWriteStream(destFile));
        logger.write('Generated ', destFile, '\n');
        deferred.resolve();
    });
    return deferred.promise;
}

