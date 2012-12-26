var path = require('path'),
    fs = require('fs'),
    common = require('../common');

exports.init = function(options) {
    var pathname = path.resolve(process.cwd(), options._[0]);
    replaceDirectory(pathname);
};

function replaceDirectory(dirname) {
    var files = fs.readdirSync(dirname);
    var len = files.length,
        filepath;
    while (len--) {
        filepath = path.join(dirname, files[len]);
        if (common.isDirectory(filepath)) {
            replaceDirectory(filepath);
        } else if (/\.(?:php|js|css)$/.test(filepath)){
            var data = fs.readFileSync(filepath, 'utf-8');
            data = data.replace(/(OutLink|InnerLink)\|click\|(\w)/gi, function($0, $1, $2) {
                return ($1.indexOf('O') === 0 ? 'OutLink' : 'InnerLink') + '|Click|' + $2.toLowerCase();
            });
            fs.writeFileSync(filepath, data, 'utf-8');
        }
    }
}
