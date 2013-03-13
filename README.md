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

## 尝试使用

    ./fes buildstatic -h
    ./fes csstoless -h
    ./fes replacefile --help
