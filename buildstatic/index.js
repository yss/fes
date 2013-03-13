var fs = require('fs'),
    path = require('path'),
    common = require('../common');

var options, showLogs, UTF8 = 'utf-8';

exports.init = function(argv) {
    var cwd = process.cwd(),
        dirname = path.resolve(cwd, argv.d || argv.dir || ''),
        filename = (argv.out || argv.o) ? path.resolve(cwd, (argv.out || argv.o)) : '',
        format = argv.format; // json or ,  default is path model
        
    showLogs = argv.log || false;

    options = {
        dirname: dirname,
        noRecursion : argv['no-recursion'] || false,
        typeReg : argv.type ? new RegExp('\.(?:' + argv.type.join('|') + ')$') : false,
        md5: argv.md5 || false
    };
    if (showLogs) {
       common.log('dirname:', dirname, 'filename:', filename);
       console.log(options);
       argv.type && console.log('type:', argv.type);
    }
    if (common.isDirectory(dirname)) {
        findFile(dirname, {}, function(fileObject) {
            showLogs && console.log(fileObject);
            if (format) {
                jsonToPath(fileObject);
            } else {
                fileObject = jsonToPath(fileObject);
            }
            if (filename) {
                fs.writeFile(filename, JSON.stringify(fileObject, 0, 4), UTF8, function(err) {
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
        fileName;
    while(len--) {
        file = files[len];
        filepath = path.join(dirname, file);
        if (/^[\.~]|\.(?:swp|swn|swo|swx|swn|bak)$|~$/.test(file)) {
            common.log(filepath, 'is been ignored.');
            continue;
        }
        if (common.isDirectory(filepath)) {
            if (!options.noRecursion) {
                findFile(filepath, fileObject[file] = {});
            }
        } else {
            if (isFixedFile(file)) {
                fileName = file.substring(0, file.lastIndexOf('.'));
                fileObject[fileName] = file;
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
    pathname = pathname ? pathname + '/' : '';
    if (common.getType(fileObject) === 'object') {
        for(var key in fileObject) {
            if (common.getType(fileObject[key]) === 'object') {
                jsonToPath(fileObject[key], obj, pathname + key);
            } else {
                obj[key] = fileObject[key] = outputMd5File(pathname + fileObject[key]);
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
function outputMd5File(pathname) {
    var pathDirname = path.join(options.dirname, pathname),
        content;
    if (options.md5) {
        var len = common.getType(options.md5) === 'number' ? options.md5 : '',
            uniqueId,
            lastPos = pathname.lastIndexOf('.');

        content = fs.readFileSync(pathDirname, UTF8);
        if (content) {
            uniqueId = common.md5(content, 'hex', len);
        } else {
            common.error('Empty file:' + pathDirname);
            process.exit(3);
        }
        pathname = pathname.substring(0, lastPos) + '.' + uniqueId + pathname.substring(lastPos);
        pathDirname = path.join(options.dirname, pathname);
    } else {
        content = fs.readFileSync(pathDirname, UTF8);
    }
    return pathname;
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
                name: '--out, -o',
                type: 'Filename',
                desc: '所要存储的文件名，可以带路径名，如：--out=./data/xx.json'
            },
            {
                name: '--format',
                type: 'Boolean',
                desc: '完全按照树状结构生成文件，还是仅仅只是单一的一对一形式。默认是一对一形式'
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
            }
        ],
        extends: [
            {
                name: 'example',
                desc: [
                    "buildjs: fes buildstatic --md5=8 -d ./view/static/js/ --type=[js]",
                    "buildcss: fes buildstatic --md5=8 -d ./view/static/css/ --type=[less] --no-recursion",
                    "buildtemplate: fes buildstatic --md5=8 -d ./view/template/ --type=[jade] --format",
                    "buildless: fes buildstatic --md5=8 -d ./view/static/css/ --type=[less] --no-recursion -o ./data/less.json"
                ]
            }
        ]
    }
}
