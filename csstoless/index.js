var fs = require('fs'),
    common = require('../common');

var jsonArr = [],
    TAB = '    ';
exports.init = function(o) {
    var filename = o._[0],
        normalFile, receiveFile;
    if (!filename) {
        common.error('请输入您要转换的CSS文件。');
        process.exit(1);
    }
    if (filename.slice(-4) !== '.css') {
        common.error('您输入的文件：', filename, '不是CSS文件，请确定后重新输入。');
        process.exit(1);
    }
    if (o._[1] === '>' && o._[2]) {
        receiveFile = o._[2];
    } else {
        receiveFile = filename.replace('.css', '.less');
    }
    fs.readFile(filename, 'utf-8', function(err, data) {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        data = data.replace(/filter:([^;]+)/gi, function($0, $1) {
            // 过滤所有的filter
            return 'filter:~"' + $1.trim() + '"';
        }).replace(/:[^:]+\\(?:0|9);/gi, function($0, $1) {
            // 过滤所有的\9 \0
            return ':~"' + $0.substr(1, $0.length-2).trim() + '";';
        });
        data = parseCss(data);
        jsonToLess(data);
        jsonArr.pop(); // 去掉 \n
        jsonArr.pop(); // 去掉最后一个 }
        // 中间缺省把对应的css转换成标准的less格式。
        fs.writeFile(receiveFile, jsonArr.join('').replace(/(\n){2,}/g, '\n'), 'utf-8', function(err) {
            if (err) {
                common.error(err);
            } else {
                common.info('outupt file to: '+ receiveFile);
            }
        });
    });
};

// 解析CSS文件为json对象
function parseCss(data) {
    var root = {},
        reg = /(?:^|\})([^\{]+)\{([^}]+)/g, // 过滤出 } ... { 以及 { ... } 之间的内容
        regCss = /\/\*[^\{]*\{[^\}]*\}.*\*\//g, // 过滤出表达式的注释 /* xx { xxx } */
        regComment = /(\s*\/\*.*\*\/\s*)+/, // 过滤出注释 /*  */
        regEmpty = /\s+/;
    // 删除一种特殊情况
    // 如：/* #id { ... } */
    data = data.replace(regCss, '');
    data.replace(reg, function($0, $1, $2) {
        var exp,
            len,
            i = 0,
            arr, arrLen, j, tmp, comment;
        $1 = $1.replace(regComment, function($0, $1) {
            if ($0) comment = $0;
            return '';
        });
        exp = $1.split(',');
        len = exp.length;
        // for #id a, #id2 a
        for (; i < len; ++i) {
            arr = exp[i].trim().split(regEmpty);
            arrLen = arr.length;
            for (j = 0, tmp = root; j < arrLen; ++j) {
                if (!tmp.hasOwnProperty(arr[j])) {
                    tmp[arr[j]] = {};
                }
                tmp = tmp[arr[j]];
            }
            // 如果之前已经有text属性
            // 意味着这个值的内容之前就存在
            if (tmp.text) {
                tmp.text += $2.trim().replace(/\\n/g, '');
            } else {
                tmp.text = $2.trim().replace(/\\n/g, '');
            }
            if (comment) {
                root[arr[0]].comment = (root[arr[0]].comment || '') + comment;
                // 保证comment只加入一次
                comment = false;
            }
        }
    });

    return root;
}

// 把解析好的json对象，转化成less
function jsonToLess(data, index) {
    index = index || 0;
    var tmp = '', l = index;
    while(l--) tmp += TAB;
    // 内容
    if (data.text) {
        jsonArr.push(tmp, data.text, '\n');
        delete data.text;
    }
    for (var key in data) {
        if (common.getType(data[key]) === 'object') {
            // 注释先行
            if (data[key].comment) {
                jsonArr.push(tmp, data[key].comment, '\n');
                delete data[key].comment;
            }
            jsonArr.push(tmp, key, ' {', '\n');
            jsonToLess(data[key], index + 1);
            l++;
        }
    }
    jsonArr.push(l > 0 ? '\n' : '', tmp.replace(TAB, ''), '}', '\n');
};

exports.help = function() {
    return {
        description: '主要是把当前的css文件转变成标准的less语法格式。',
        params: [
            {
                name: '-h, --help',
                type: 'boolean',
                desc: '暂时没有任何用到的参数可供使用。目前只是简单的过滤了CSS文件里的filter属性，其他功能有待后续完善。'
            }
        ],
        extends: [
            {
                'name': 'Examples',
                'desc': [
                    'fes csstoless filename.css > nameIt.less 这条命令就是把对应的文件转化到给出的less文件',
                    'fes csstoless filename.css 这条命令就会把对应的css文件转化到它目录下的filename.less文件',
                    '如果之前目录下就有filename.less，这将会是一个覆盖的操作。'
                ]
            }
        ]
    }
};
