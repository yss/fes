# fes
*fe.scripts前端脚本自动化。*

## 安装
``` sh
[sudo] npm install fes
```

建议在/usr/bin/下加入fes的软链( `cd /usr/bin && ln -s yourfespath fes` )。
## 说明
fes本质上只做两件事情。

1. 路由转发，这样可以做到只创建一个全局命令fes，而且方便管理。
2. 对命令行参数进行一次解析，这样每次写方法就不需要自己重新去做命令行解析了。

## 功能
### buildstatic
目录转JSON对象，并过滤文件。
``` js
// 输出文件夹下，后缀为js，并生成带版本号格式的JSON文件，如：
// {
//      "jquery": "common/jquery.7xa872sx.js"
// }
fes buildstatic --md5=8 --dir=./view/static/js/ --type=[js]

```
### csstoless
``` js
// xxx.css => xxx.less
fes csstoless xxx.css
// xxx.css => a.less
fes csstoless xxx.css > a.less
```

### imgmin
``` js
// 压缩当前Git仓库中改动和增加的图片
fes imgmin --git
// 压缩img目录下的所有图片
fes imgmin ../static/img/
// 压缩多个目录下的图片
fes imgmin ../static/img/ ./img/

```

## 尝试使用

    ./fes buildstatic -h
    ./fes csstoless -h
    ./fes imgmin --help
