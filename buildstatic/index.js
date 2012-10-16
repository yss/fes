var fs = require('fs'),
    path = require('path'),
    common = require('../common');

exports.init = function(argv) {
    var cwd = process.cwd(),
        dirname = path.join(cwd, argv.d || argv.dir),
        filename = path.join(cwd, argv.file || 'data.json'),
        format = argv.format; // json or ,  default is path model
    fs.exists(dirname, function(exists) {
        if (exists) {
            findFile(dirname, {}, function(fileObject) {
                if (format !== 'json') {
                    fileObject = jsonToPath(fileObject);
                } else {
                    jsonToPath(fileObject);
                }
                fs.writeFile(filename, JSON.stringify(fileObject, 0, 4), 'utf-8', function(err) {
                    if (err) common.error('Write file: ', filename, ' error!');
                    else common.log('Write file: ', filename);
                });
            });
        } else {
            common.error('Directory :', dirname, ' is not exists!!!');
        }
    });
    
};

function findFile(dirname, fileObject, callback) {
    var files = fs.readdirSync(dirname);
    var len = files.length,
        file,
        filepath,
        arr;
    while(len--) {
        file = files[len];
        filepath = path.join(dirname, file);
        if (common.isDirectory(filepath)) {
            findFile(filepath, fileObject[file] = {});
        } else {
            if (!isIgnoreFile(file)) {
                arr = file.split('.');
                fileObject[arr[0]] = file;
            }
        }
    }
    callback&&callback(fileObject);
}

function isIgnoreFile(file) {
    return file.indexOf('.') === 0;
}

function jsonToPath(fileObject, obj, pathname) {
    obj = obj || {};
    pathname = pathname || '';
    if (common.getType(fileObject) === 'object') {
        for(var key in fileObject) {
            if (common.getType(fileObject[key]) === 'object') {
                jsonToPath(fileObject[key], obj, pathname + '/' + key);
            } else {
                obj[key] = fileObject[key] = pathname + '/' + fileObject[key];
            }
        }
    } else {
        return;
    }
    return obj;
}
