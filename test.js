var path = require('path');
var common = require('./common');
parseData = ['-a={a:{test:ww,t:1},c:e}'];
parseData2 = ['-a=[a,v,b,d]'];

common.info('parseArgv is testing...')
common.log('test1:', parseData.join(''));
console.log(common.parseArgv(parseData).a);
common.log('test2:', parseData2.join(''));
console.log(common.parseArgv(parseData2).a)
// console.log(common.createDirectory(path.join(process.cwd(), '/tt/cc/ff.tt'), process.cwd()));
console.log(common.createDirectory(path.join(process.cwd(), 'tt/cc/ttc.c')));
