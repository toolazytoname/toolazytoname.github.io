---

layout: post
title:  "iOS脚本打包"
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
   3. 可以通过launchctl start手动触发 shell
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
   6. 查看已打完包的entitlements和版本号
   6. 发邮件通知




## 工作目录结构

将工作目录下放放两个文件，一个是打包相关，一个是工程源码。因为工程源码文件与壳工程同步，所以没有把打包相关的给放进来。

根目录

* XXXXPlus（源码）
* Package
  * autoPackage.sh（打包脚本）

  * plist

    *   app-store.plist
    *   enterprise.plist

  * IPADir

    *   schemeX
        *   Release
            *   2018-12-27-16/16/29
                *   xxxxxx2018-12-27-14/59/08.xcarchive
                *   xxxxxx.ipa
                *   DistributionSummary.plist
                *   ExportOptions.plist
                *   Packaging.log
                *   Podfile
                *   podfile.lock




# 源码

~~~shell
#在上一个脚本的基础上，增加了git 获取壳工程的一些语句
XXXXGitLabURL=http://gitlab.XXXXXs
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
git clone ${XXXXGitLabURL}
cd XXXX
git pull
git checkout develop
git log -1
git branch

~~~



# 定时器设置

用的是苹果推荐的launchctl 命令，因为打算不受系统重启的影响，所以放到了/Library/LaunchDaemons目录下。

1. 完成功能

   1. 间隔两小时出一个。
   2. 每天固定时间点执行
   3. launchctl start 管用
   4. 导出的日志文件，有一个时间戳，每次导出一个单独的日志文件。直接写在shell 里重定向，没有通过StandardOutPath配置。


~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>com.XXXX.autoPackage</string>
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

**注意：这里我踩了一个坑，通过看man得知 start 的参数是一个label，load 的参数是path**

~~~shell
launchctl load   com.XXXX.autoPackage.plist
launchctl unload com.XXXX.autoPackage.plist
launchctl start  com.XXXX.autoPackage
launchctl stop   com.XXXX.autoPackage
launchctl list | grep XXXX
~~~



- 要让任务生效，必须先load命令加载这个plist
- 如果任务呗修改了，那么必须先unload，然后重新load
- start可以测试任务，这个是立即执行，不管时间到了没有
- 执行start和unload前，任务必须先load过，否则报错
- stop可以停止任务

# 配置邮件

~~~shell
# 安装 msmtp
brew install msmtp
~~~


~~~shell
#编辑文件
cat ~/.mailrc
set sendmail=/usr/local/bin/msmtp
~~~


~~~shell
#编辑文件
cat ~/.msmtprc
# Example for a user configuration file
# Set default values for all following accounts.
defaults

logfile /tmp/qqemail.log
# A  service
account qq
host smtp.qq.com
port 587
from XXX@foxmail.com
auth login

tls on
tls_certcheck off
user XXX@foxmail.com
password XXX
# You need to set a default account for Mail
account default : qq
~~~

~~~shell
# 设置正确的访问权限
chmod 600 ~/.msmtprc


# 试用
$ echo "Hello world" | mail -s "msmtp test at `date`" yourfriend®@gmail.com
~~~




# 坑

## git秘钥获取

git 获取不到存在 keychain 里面的密码，每次都是要手工输入，推测是keychain挂掉了，重启一下Mac就好了。

## ruby权限问题

提示我，突然有一天打包失败，执行pod update 失败，报这个错

~~~shell
Errno::EACCES: Permission denied @ rb_sysopen - XXXXXX
Errno::EACCES - Permission denied @ apply2files - /XXXXXX

Errno::EPERM - Operation not permitted @ apply2files - /Users/yiche/weichao/BitAutoPlus/Pods/BPAdvertisingLib/BPAdvertisingLib/Classes/BPAAdvertisingManager+Image.h

~~~

解决：

~~~shell
sudo chmod -R 777 XXXXXX
sudo chown -R XXX XXXXXX
~~~

## pod update 失败

未将定时任务和脚本 结合。某几个特殊的库，每次更新都会导致pod update 定时执行失败，手动命令行执行没有这个问题。

已规避，参看上一篇文章[《iOS自动打包》]({{ site.url }}/ios/2018/12/27/package/l) 最后。

# fastlane

无意间发现这么个东西  [fastlane](https://docs.fastlane.tools) 和 [Transporter](https://help.apple.com/itc/transporteruserguide/?spm=a2c4e.11153940.blogcont701385.7.6aea4101STSXaY#/itc0d5b535bf)， 参考[谈一谈 IPA 上传到 App Store Connect 的几种方法](https://yq.aliyun.com/articles/701385?spm=a2c4e.11155435.0.0.4bfd6186xVSLrw)。





# 参考

1. [Creating a launchd Property List File](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html#//apple_ref/doc/uid/TP40001762-104142)
2. The manual pages for `launchd` and `launchd.plist` are the two best sources for information about `launchd`.
