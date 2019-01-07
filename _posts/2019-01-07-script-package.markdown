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

1. 邮件（未实现）
2. 远程执行（未实现）
3. 定时器
   1. 每隔两小时，自动触发一次脚本
   2. 不受系统重启影响
4. 通过脚本
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
XXXXXGitLabURL=http://gitlab.XXXXXs
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
git clone ${XXXXXGitLabURL}
cd XXXXX
git pull
git checkout develop
git log -1
git branch

~~~



# 定时器设置

用的是苹果推荐的launchctl 命令，因为打算不受系统重启的影响，所以放到了/Library/LaunchDaemons目录下。



1. 已完成

   1. 间隔两小时出一个。
   2. launchctl start ,方便调试

2. 待完成

   1. 导出的日志文件，加一个时间参数，每次导出文件分开

   2. 每天固定时间点执行


导出日志的目录想加一个参数。

~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>com.XXXXX.autoPackage</string>
	<key>ProgramArguments</key>
	<array>
		<string>/bin/bash</string>
		<string>/Users/FG/lazy/Package/autoPackage.sh</string>
	</array>
	<key>StartInterval</key>
	<integer>7200</integer>
	<key>StandardOutPath</key>
	<string>/Users/FG/lazy/Package/log/log</string>
	<key>StandardErrorPath</key>
	<string>/Users/FG/lazy/Package/log/errorlog</string>
</dict>
</plist>

~~~



~~~shell
launchctl load   com.XXXXX.autoPackage.plist
launchctl unload com.XXXXX.autoPackage.plist
launchctl start  com.XXXXX.autoPackage
launchctl stop   com.XXXXX.autoPackage
launchctl list
~~~



- 要让任务生效，必须先load命令加载这个plist
- 如果任务呗修改了，那么必须先unload，然后重新load
- start可以测试任务，这个是立即执行，不管时间到了没有
- 执行start和unload前，任务必须先load过，否则报错
- stop可以停止任务



## 踩过坑

###  launchctl start  不管用

知道为啥之前start不了了。

自己看下面man吧。传的参数含义不一样。

~~~shell
 load | unload [-wF] [-S sessiontype] [-D searchpath] paths ...
              Load the specified configuration files or directories of configuration
              files.
~~~

~~~shell
  start label
              Start the specified job by label. The expected use of this subcommand is for
              debugging and testing so that one can manually kick-start an on-demand
              server.
~~~





## 参考

1. [Creating a launchd Property List File](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html#//apple_ref/doc/uid/TP40001762-104142)

2. The manual pages for `launchd` and `launchd.plist` are the two best sources for information about `launchd`.

   ~~~shell
   man launchd.plist
   man launchctl
   ~~~



   ~~~shell
        StartInterval <integer>
        This optional key causes the job to be started every N seconds. If the system is
        asleep during the time of the next scheduled interval firing, that interval will be
        missed due to shortcomings in kqueue(3).  If the job is running during an interval
        firing, that interval firing will likewise be missed.
   
        StartCalendarInterval <dictionary of integers or array of dictionaries of integers>
        This optional key causes the job to be started every calendar interval as specified.
        Missing arguments are considered to be wildcard. The semantics are similar to
        crontab(5) in how firing dates are specified. Multiple dictionaries may be specified
        in an array to schedule multiple calendar intervals.
   
        Unlike cron which skips job invocations when the computer is asleep, launchd will
        start the job the next time the computer wakes up.  If multiple intervals transpire
        before the computer is woken, those events will be coalesced into one event upon wake
        from sleep.
   
        Note that StartInterval and StartCalendarInterval are not aware of each other. They
        are evaluated completely independently by the system.
   
              Minute <integer>
              The minute (0-59) on which this job will be run.
   
              Hour <integer>
              The hour (0-23) on which this job will be run.
   
              Day <integer>
              The day of the month (1-31) on which this job will be run.
   
              Weekday <integer>
              The weekday on which this job will be run (0 and 7 are Sunday). If both Day and
              Weekday are specificed, then the job will be started if either one matches the
              current date.
   
              Month <integer>
              The month (1-12) on which this job will be run.
   
   
   
        StandardOutPath <string>
        This optional key specifies that the given path should be mapped to the job's
        stdout(4), and that any writes to the job's stdout(4) will go to the given file. If
        the file does not exist, it will be created with writable permissions and ownership
        reflecting the user and/or group specified as the UserName and/or GroupName, respec-
        tively (if set) and permissions reflecting the umask(2) specified by the Umask key,
        if set.
   
        StandardErrorPath <string>
        This optional key specifies that the given path should be mapped to the job's
        stderr(4)
   ~~~

