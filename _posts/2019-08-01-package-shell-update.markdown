---

layout: post
title:  "iOS脚本打包升级"
date:   2019-8-1 11:42:32 +0800
categories: iOS
catalog:  true
tags:
    - iOS
    - 打包
---



这是打包系列 

* 第一篇 [《iOS jekins 打包》]({{ site.url }}/ios/2018/12/27/package-jekins/) 

* 第二篇 [《iOS 脚本打包》]({{ site.url }}/ios/2019/01/07/package-shell/) 

* 第三篇 [《iOS脚本打包升级》]({{ site.url }}/ios/2019/08/01/package-shell-update/) 



# 如何使用

1. 执行 ./package.sh  -h 
   
   
   
   ~~~shell
   package.sh [-h | [-a <app>] | [-b <branch>] | [-c <channel>] | [-p <custom pods>] | [-r <content to replace>] | [-v]] 
   
   
   
   -h    - Help. 
   
   -a    - App name, valid values are 'BitAutoPlus' or 'UsedCarShopping'. 
   
           Default values: 'BitAutoPlus'. 
   
   -b    - Branch name, valid values are 'master', 'develop' ,or others 
   
           Default values: 命令传入参数的优先级更高，如果shell命令没有代入分支参数，则用配置文件中的默认值. 
   
   -c    - Channel name, valid values are 'enterprise', or 'app_store'. 
   
           Default values: 'enterprise'. 
   
   -p    - Podfile mode, valid values are 'local' ,'local_update','network','network_replace_section',or 'network_replace_pods' 
   
           local                   Podfile用本地的，不执行pod update. 
   
           local_update            Podfile用本地的，执行pod update. 
   
           network                 Podfile用网络刷新本地，执行pod update. 
   
           network_replace_section Podfile用网络刷新本地，替换原始脚本中的 
   
                                   ShellPodsStart和ShellPodsEnd 之间内容,执行pod update. 
   
           network_replace_pods    Podfile用网络刷新本地，替换原始脚本中的 特定的pod内容内容为本地目录,执行pod update. 
   
           Default value: network 
   
   -r    - Custom pods content 传入自定义的内容，只有当-p 为replace_section或replace_pods才会有效 
   
           当p的值为network_replace_section:  内容为带替换的内容，斜杆需要在前面加反斜杠转义，最后加上 
   
   换行，同时加上\作为换行符保证参数的可读性 
   
           当p的值为network_replace_pods:    内容为需要自定义的数组，例如 'BPWelfareLib,BPFlutter' 
   
   -v    - Verbose,输出详细日志。 
   Build product in 'Package/IPADir/<scheme_name>/<development_mode>/<build_datetime>' directory. 
   
   example:
   易车测试包:
             ./package.sh -a BitAutoPlus -c enterprise -v
   易车商店包:
             ./package.sh -a BitAutoPlus -c app_store -v
   二手车测试包:
             ./package.sh -a UsedCarShopping -b master -c enterprise -v
   二手车商店包:
             ./package.sh -a UsedCarShopping -c app_store -v
   易车本地商店包:
             ./package.sh -a BitAutoPlus -c app_store -p local -v
              这种场景一般应用在发现了一个线上崩溃，打之前某版本的hotfix,把当前工程设置成目标状态，以下命令会直接根据本地代码，编译打包上传
              参数 local_update 与local 的区别是是否会执行pod update
   易车指定版本包:
              详情参见package_for_QA.sh
             ./package.sh -a BitAutoPlus -c enterprise  -v -p network_replace_section  -r  'something'
   本地开发环境配置:
             详情参见prepare_develop_bitauto.sh
             ./package.sh -a BitAutoPlus -c enterprise -v -p network_replace_pods -r 'BPWelfareLib,BPFlutter'
   ~~~
   
   
   
   


## 目录结构

~~~shell
├── IPADir（产出物目录）
├── README.md
├── dynamic_command.sh(写了一半的动态脚本，因为涉及到换行符没搞定，所以这段逻辑写在jekkins)
├── log
│   └── BitAutoPlus（log 按照不同App分不同文件夹）
│       └── 20190730140805.log（log文件名按时间戳命名）
├── package.sh（主力打包脚本）
├── package_for_QA.sh（给测试用的打包脚本）
├── plist(archive配置plist)
│   ├── BitAutoPlus_App_Store.plist（按照工程名+渠道名命名）
│   ├── BitAutoPlus_Enterprise.plist
│   ├── UsedCarShopping_App_Store.plist
│   └── UsedCarShopping_Enterprise.plist
├── prepare_develop_bitauto.sh（全量更新本地代码到最新）
├── scripts（子shell）
│   ├── apple_upload.sh（上传到苹果）
│   ├── base_command.sh（每个command 都在这里执行）
│   ├── check_app.sh（上传完成后，对App 做一些校验）
│   ├── edit_project_setting.sh（编译前，做一些个性化修改）
│   ├── help.sh（输出帮助文本）
│   ├── log.sh
│   ├── mail.sh
│   ├── package_mail.sh（对mail做一层封装）
│   ├── pgy_upload.sh（上传蒲公英，包含了失败重试逻辑）
│   ├── remote.sh（ssh远程自动登录执行，脚本）
│   ├── water_mark.sh（icon加水印）
│   └── xcode_build.sh（clen，编译，导出IPA）
├── shellConfig（不同的App的配置参数不同）
│   ├── BitAutoPlus_config.sh
│   └── UsedCarShopping_config.sh
└── upload_apple_client.sh（上传IPA到苹果，单独调用）

~~~






# 升级功能点

1. 入参函数调整，用getopts处理
2. 支持-h 打印如何使用脚本 
3. 模块化，一整个shell脚本，可复用的部分拆了出来。加了一些防止重复引入的逻辑 
4. 测试icon加水印 
5. 上传蒲公英失败，重试3次 
6. 不同App的配置参数分开，整理成配置文件。如果新增App，只需要新增配置文件即可 
7. 每个command 执行时间做记录，执行结果判断，见base_command.sh 
8. 日志文件名，邮件title，icon 上的三个时间戳统一，方便追溯 
9. 支持本地代码自动更新，开发人员专用 
10. 如果打的是商店包，则提交commit ，提交内容时对应的版本号和build号（时间戳） 





# 知识点

1. 将命令执行结果赋给变量—反引号与$() 
2. shell if 判断逻辑 ，数字用 (())    ,非数字用 [[]] 参考  [ Shell[[]\]详解：检测某个条件是否成立](http://c.biancheng.net/view/2751.html )



# 未做

1. 证书到期时间检测，到期提前通知 
2. 描述文件到期时间检测，到期提前通知 
3. 苹果上传结果解析 
4. 未集成 fastlane 
5. 遗留更新失败问题检测 
6. 并发打多个包？检测exit or 支持并发。并发逻辑，目录根据时间戳去生成，这样就不会冲突 
7. Cannot proceed with delivery: an existing transporter instance is currently uploading this package 目前只能通过重启电脑解决



# 参考

1.   [ Shell\[\[\]]详解：检测某个条件是否成立](http://c.biancheng.net/view/2751.html )
2. [shell如何模块化和复用——shell深入学习](https://arganzheng.iteye.com/blog/1174470)
3. [Shell脚本的模块化和脚本复用](https://blog.51cto.com/atong/1912179)

