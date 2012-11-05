var fs = require('fs'),
    path = require('path'),
    uglifyjs = require('uglify-js2'),
    common = require('../common');

var options, showLogs;

exports.init = function(argv) {
    var cwd = process.cwd(),
        dirname = path.resolve(cwd, argv.d || argv.dir),
        filename = argv.file ? path.resolve(cwd, argv.file) : '',
        format = argv.format; // json or ,  default is path model
        
    showLogs = argv.log || false;

    options = {
        dirname: dirname,
        noRecursion : argv['no-recursion'] || false,
        typeReg : argv.type ? new RegExp('\.(?:' + argv.type.join('|') + ')$') : false,
        md5: argv.md5 || false,
        compress: argv.compress || argv.c || false
    };
    if (showLogs) {
       common.log('dirname:', dirname, 'filename:', filename);
       common.log(options);
       argv.type && common.log('type:', argv.type);
    }
    if (common.isDirectory(dirname)) {
        findFile(dirname, {}, function(fileObject) {
            showLogs && common.log(fileObject);
            if (format !== 'json') {
                fileObject = jsonToPath(fileObject);
            } else {
                jsonToPath(fileObject);
            }
            if (filename) {
                fs.writeFile(filename, JSON.stringify(fileObject, 0, 4), 'utf-8', function(err) {
                    if (err) common.error('Write file: ', filename, ' error!');
                    else common.log('Write file: ', filename);
                });
            } else {
                console.log(JSON.stringify(fileObject, 0, 4));
            }
        });
    } else {
        common.error('Directory :', dirname, ' is not exists!!!');
    }
};

/**
 * 查找一个目录下的所有文件并生成object对象，传入回调函数
 * @param {String} dirname
 * @param {Object} fileObject
 * @param {Boolean} recursion
 * @param {Function} callback
 * @return
 */
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
            if (!options.noRecursion) {
                findFile(filepath, fileObject[file] = {});
            }
        } else {
            if (isFixedFile(file)) {
                arr = file.split('.');
                fileObject[arr[0]] = file;
            }
        }
    }
    callback&&callback(fileObject);
}

/**
 * 是否是指定格式的文件
 */
function isFixedFile(file) {
    if (options.typeReg) {
        return options.typeReg.test(file);
    }
    return true;
}

/**
 * 把文件路径表解析成所需要生成的表
 */
function jsonToPath(fileObject, obj, pathname) {
    obj = obj || {};
    pathname = pathname || '';
    if (common.getType(fileObject) === 'object') {
        for(var key in fileObject) {
            if (common.getType(fileObject[key]) === 'object') {
                jsonToPath(fileObject[key], obj, pathname + '/' + key);
            } else {
                obj[key] = fileObject[key] = minify(pathname + '/' + fileObject[key]);
            }
        }
    } else {
        return;
    }
    return obj;
}

/**
 * 输出文件对应的md5值
 */
function outputMd5File(pathname, data) {
    if (options.md5) {
        var pathDirname = path.join(options.dirname, pathname),
            len = common.getType(options.md5) === 'number' ? options.md5 : '',
            content = (data && data.code) || fs.readFileSync(pathDirname, 'utf-8'),
            uniqueId,
            lastPos = pathname.lastIndexOf('.');
        if (content) {
            uniqueId = common.md5(content, 'hex', len);
        } else {
            common.error('Empty file:' + pathDirname);
            process.exit(3);
        }
        pathname = pathname.substring(0, lastPos) + '.' + uniqueId + pathname.substring(lastPos);
        pathDirname = path.join(options.dirname, pathname);
        fs.writeFile(pathDirname, content, 'utf-8', function(err) {
            if (err) {
                common.error('[Error]Write File ' + pathDirname + '.');
                process.exit(2);
            }
        });
    }
    return pathname;
}

/**
 * 压缩文件
 */
function minify(pathname) {
    if (options.compress) {
        if (/\.(css|js)$/.test(pathname)) {
            var type = RegExp.$1,
                fullPath = path.join(options.dirname, pathname),
                data = {};
            if (type === 'js') {
                data.code = uglifyjs.minify(fullPath).code;
            } else { // if (type === 'css') {
                data.code  = compressCss(fullPath);
            }
            return outputMd5File(pathname, data);
        }
    }
    return outputMd5File(pathname);
    
}

function compressCss(pathname) {
    return fs.readFileSync(pathname, 'utf-8')
        .replace(/\/\*(.*?)\*\/|[\t\r\n]/g, '')
        .replace(/ *(\{|\}|\:|\,|\>) */g, '$1')
        .replace(/0px/g, '0');

}

exports.help = function() {
    return {
        description: '生成文件名和与之对应的路径名，为了自动打包组装静态资源文件地址',
        params: [
            {
                name: '--help, -h',
                type: 'Boolean',
                desc: '帮助信息'
            },
            {
                name: '--dir, -d',
                type: 'Path',
                desc: '所要自动打包的文件夹路径，相对于当前的路径或绝对路径。如：--dir=./path'
            },
            {
                name: '--file',
                type: 'Path, Filename',
                desc: '所要存储的文件名，可以带路径名，如：--flie=./data/xx.json'
            },
            {
                name: '--format',
                type: 'String',
                desc: '完全按照树状结构生成文件，还是仅仅只是单一的一对一形式。默认是树状结构，需要改变时使用：--format=json'
            },
            {
                name: '--no-recursion',
                type: 'Boolean',
                desc: '是否递归查询给定的文件路径'
            },
            {
                name: '--type',
                type: 'Array',
                desc: '固定的文件后缀类型数组，如：--type=[less,coffee]'
            },
            {
                name: '--md5',
                type: 'Boolean, Number',
                desc: '是否计算文件的md5值并增加至后缀前，值为数字时代表md5值的前多少位，默认为false'
            },
            {
                name: '-c, --compress',
                type: 'Boolean',
                desc: '是否压缩，只支持.js & .css后缀文件，默认为false'
            }

        ]
    }
}
