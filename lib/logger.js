'use strict';
module.exports = {
    'success': function (type, fileName) {
        console.log('\n*****  Successfully compiled', type, ':', fileName);
    },
    'error': function (type, fileName, msg) {
        console.log('\n***** Failed while compiling', type, ':', fileName, '\nError:', msg);
    }
};