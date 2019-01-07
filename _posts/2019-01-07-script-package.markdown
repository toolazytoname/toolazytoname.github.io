---

layout: post
title:  "iOS脚本自动打包"
date:   2019-1-7 10:02:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS 
---



# 效果

1. 定时器
   1. 每隔两小时，自动触发一次脚本
   2. 不受系统重启影响
2. 通过脚本
   1. 通过git拉取远端壳工程最新的源码
   2. 打包前自动拉取远端Podfile覆盖本地文件(和工程目录分开管理)
   3. pod update
   4. 自动上传蒲公英
   5. 备份了

      1. .xcarchive文件夹

      2. ipa 文件

      3. Podfile

      4. podfile.lock.




## 工作目录结构

将工作目录下放放两个文件，一个是打包相关，一个是工程源码。因为工程源码文件与壳工程同步，所以没有把打包相关的给放进来。

根目录

* XXXXPlus（源码）
* Package
  * autoPackage.sh（打包脚本）

  * plist

    *   app-store.plist
    *   enterprise.plist

  * build

    *   xxxxxx2018-12-27-14/59/08.xcarchive
    *   xxxxxx2018-12-27-15/22/33.xcarchive

  * IPADir

    *   Release
        *   2018-12-27-16/16/29
            *   xxxxxx.ipa
            *   DistributionSummary.plist
            *   ExportOptions.plist
            *   Packaging.log
            *   Podfile
            *   podfile.lock




# 源码

~~~shell
#在上一个脚本的基础上，增加了git 获取壳工程的一些语句
BitAutoPlusGitLabURL=http://gitlab.XXXXXs
echo '///-----------'
echo '/// Git '
echo '///-----------'
#工程绝对路径
project_path=$(cd `dirname $0`; pwd)
echo  'project_path:'${project_path}
cd ${project_path}
cd ../
echo "pwd:$(pwd)"
work_path=$(pwd)
git clone ${BitAutoPlusGitLabURL}
cd BitAutoPlus
git pull
git checkout develop
git log -1
git branch

~~~



# 定时器设置

用的是苹果推荐的launchctl 命令，因为打算不受系统重启的影响，所以放到了/Library/LaunchDaemons目录下。



1. 已完成

   1. 间隔两小时出一个。

2. 待完成

   1. 导出的日志文件，加一个时间参数，每次导出文件分开

   2. 每天固定时间点执行

   3. launchctl start 管用


导出日志的目录想加一个参数。

~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>com.BitAutoPlus.autoPackage</string>
	<key>ProgramArguments</key>
	<array>
		<string>/bin/bash</string>
		<string>/Users/yiche/weichao/Package/autoPackage.sh</string>
	</array>
	<key>StartInterval</key>
	<integer>7200</integer>
	<key>StandardOutPath</key>
	<string>/Users/yiche/weichao/Package/log/log</string>
	<key>StandardErrorPath</key>
	<string>/Users/yiche/weichao/Package/log/errorlog</string>
</dict>
</plist>

~~~



~~~shell
launchctl load   com.aigo.launchctl.plist
launchctl unload com.aigo.launchctl.plist
launchctl start  com.aigo.launchctl.plist
launchctl stop   com.aigo.launchctl.plist
launchctl list
~~~



- 要让任务生效，必须先load命令加载这个plist
- 如果任务呗修改了，那么必须先unload，然后重新load
- start可以测试任务，这个是立即执行，不管时间到了没有(发现死活不管用)
- 执行start和unload前，任务必须先load过，否则报错
- stop可以停止任务



## 参考

1. [Creating a launchd Property List File](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html#//apple_ref/doc/uid/TP40001762-104142)


