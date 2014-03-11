'use strict';
var path = require('path'),
    fs = require('fs');

module.exports = {

    getName: function getName (filePath, root) {
        var fileInfo = {},
            relative = module.exports.getRelative(filePath, root),
            paths;

        return relative.replace(path.extname(relative), '');
    },

    getRelative: function getRelative (filePath, root) {
        var relative = filePath.replace(root, '');
        if (relative[0] === path.sep) {
            relative = relative.substr(1);
        }

        return relative;
    },
    genNameWithProp: function genNameWithProp(filePath, root, localeRoot, cb) {

        var relative = module.exports.getRelative(filePath, localeRoot),
            tmpName = relative.replace(path.extname(relative), ''),
            paths = tmpName.split(path.sep),
            locale = [],
            name;

        //figure out the locale . it could be just like 'en' or 'en_US'
        //need to cover both cases

        locale.push(paths.shift());

        //check if the name exists in the templates folder
        name = paths.join(path.sep);
        console.info('filePath:', name);

        fs.exists(path.join(root, name + '.dust'), function (exists) {
            var error;
            if (!exists) {
                locale.unshift(paths.shift());
                name = paths.join(path.sep);
                fs.exists(path.join(root, name + '.dust'), function (exists) {
                    if (!exists) {
                        error = new Error('Unable to find the dust file corresponding to property file');
                        logger.error('dust',filePath, error);
                        cb(error);
                    } else {
                        cb(null,genFileInfo(locale, name));
                    }
                });
            } else {
                return cb(null, genFileInfo(locale, name));
            }
        });
    },
    genFilePath: function genFilePath(base, fileInfo, ext) {
        var filePath;
        if (fileInfo.locale) {
            filePath = fileInfo.country ? path.join(fileInfo.country, fileInfo.language) : fileInfo.language;
        }
        return filePath ? path.join(base, filePath, fileInfo.name + '.' + ext) : path.join(base, fileInfo.name + '.' + ext);
    }
};

function genFileInfo(locale, name) {
    return {
        locale: locale.join('_'),
        name: name,
        language: locale[0],
        country: locale.length > 1 ? locale[1] : undefined
    };
}
