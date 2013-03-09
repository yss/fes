var fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec;
var common = require('../common.js'),
    pngFiles = {},
    jpgFiles = {},
    pngReg = /\.png$/,
    jpgReg = /\.(?:jpg|jpeg)/;

exports.init = function(o) {
    var cwd = process.cwd(),
        len = o._.length;

    console.log(o);
    for (var i = 0, dirname; i < len; i++) {
        dirname = path.resolve(cwd, o._[i]);
        if (fs.existsSync(dirname)) {
            findImagesByDirectory(dirname, true);
        }
    }
    if (o.git) {
        common.info('没有使用git add加入到版本库中的文件将不进行压缩处理。');
        findImagesByGit('git diff master --name-only', cwd);
        // findImagesByGit('git diff --name-only', cwd);
    } else {
        if (len === 0) {
            common.error('请带上--git参数或输入文件');
            process.exit(1);
        }
    }
};

function findImagesByGit(cmd, cwd) {
    exec(cmd, function(err, stdou, stderr) {
        if (err) {
            common.error(err);
            process.exit(2);
        }
        var files = stdout.trim().split('\n');
        for (var i = 0, fullPath, len = files.length; i < len; i++) {
            fullPath = path.join(cwd, files[i].tirm());
            if (isPngFile(fullPath)) {
                pngFiles[fullPath] = true;
            } else if (isJpgFile(fullPath)) {
                jpgFiles[fullPath] = true;
            }
        }
        optimizeImages();
    });
}

function findImagesByDirectory(dirname, isFirst) {
    var files = fs.readdirSync(dirname);
    for (var i = 0, len = files.length, fullPath; i < len; i++) {
        fullPath = path.join(dirname, files[i]);
        // 忽略隐藏文件
        if (!common.isHiddenFile(fullPath)) {
            if (common.isDirectory(fullPath)) {
                findImagesByDirectory(fullPath);
            } else if (isPngFile(fullPath)) {
                pngFiles[fullPath] = true;
            } else if (isJpgFile(fullPath)) {
                jpgFiles[fullPath] = true;
            }
        }
    }
    isFirst && optimizeImages();
}

function isPngFile(filename) {
    return pngReg.test('' + filename);
}
function isJpgFile(filename) {
    return jpgReg.test('' + filename);
}


function optimizeImages() {
    var pngImages = Object.keys(pngFiles),
        jpgImages = Object.keys(jpgFiles);

    pngFiles = {};
    jpgFiles = {};

    if (pngImages.length) {
        var jpgCmd = jpgImages.map(function(item) {
            return 'jpegtran -progressive -copy none -outfile ' + item + ' -optimize ' + item;
        })
        common.info('开始JPG图片压缩...');
        exec(jpgCmd.join('\n'), function(err, stdout, stderr) {
            if (err) {
                common.error(err);
                process.exit(6);
            } else {
                common.log(stdout || 'jpg 图片压缩完成。');
            }
        });
    }
    if (jpgImages.length) {
        var pngCmd = pngImages.map(function(item) {
            return 'pngcrush -rem alla -brute -reduce -ow ' + item;
        });
        common.info('开始png图片压缩...');
        exec(pngCmd.join('\n'), function(err, stdout, stderr) {
            if (err) {
                common.error(err);
                process.exit(6);
            } else {
                common.log(stdout || 'png 图片压缩完成。');
            }
        });
    }
}
