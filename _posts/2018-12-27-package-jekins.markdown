---

layout: post
title:  "iOS jekins 打包"
date:   2018-12-27 18:09:32 +0800
categories: iOS
catalog:  true
tags:
    - 打包
    - iOS
---


这是打包系列

- 第一篇 [《iOS jekins 打包》]({{ site.url }}/ios/2018/12/27/package-jekins/)

- 第二篇 [《iOS 脚本打包》]({{ site.url }}/ios/2019/01/07/package-shell/)

- 第三篇 [《iOS脚本打包升级》]({{ site.url }}/ios/2019/08/01/package-shell-update/)



# jerkins 设置

## 参数化构建过程

把脚本所需的参数放到jekkins的设置里面

| 选项参数 |                                     |
| -------- | ----------------------------------- |
| 名称     | PACKAGE_APP_JENKINS                 |
| 选项     | AppName*****<br>AppNameAnother      |
| 描述     | 打包App的名字 |

| 选项参数 |                      |
| -------- | -------------------- |
| 名称     | SHELL_BRANCH_JENKINS |
| 选项     | develop<br>master    |
| 描述     | 壳工程所在的分支名   |

| 选项参数 |                         |
| -------- | ----------------------- |
| 名称     | UPLOAD_CHANNEL_JENKINS  |
| 选项     | enterprise<br>app_store |
| 描述     | 上传渠道                |


| 选项参数 |                                                              |
| -------- | ------------------------------------------------------------ |
| 名称     | CUSTOM_PODS_JENKINS                                          |
| 选项     | network<br>local<br>local_update<br>network_replace_section<br>network_replace_pods |
| 描述     | local<br>含义：拉取壳工程指定分支最新代码，Podfile用本地从Git获取的，不执行pod update.<br><br>local_update<br>含义：拉取壳工程指定分支最新代码，Podfile用本地从Git获取的，执行pod update.<br><br/>network<br>含义：拉取壳工程指定分支最新代码，Podfile用网络刷新本地，执行pod update.<br><br>network_replace_section<br>含义：Podfile用网络刷新本地，替换原始脚本中的#ShellPodsStart和#ShellPodsEnd 之间内容,执行pod update.<br><br>network_replace_pods<br>含义：Podfile用网络刷新本地，替换原始脚本中的 特定的pod内容内容为本地目录,执行pod update.<br><br>Default value: network |



| 文本参数 |                                                              |
| -------- | ------------------------------------------------------------ |
| 名称     | CUSTOM_PODS_CONTENT_JENKINS                                  |
| 默认值   | "#ShellPodsStart\\n\<br/>#车型\\n\<br/>    pod 'BPCarModelLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPCarModelLib.git', :tag => '0.9.09weichao'\\n\<br/>#资讯\\n\<br/>    pod 'BPNewsLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPNewsLib.git', :tag => '0.9.03'\\n\<br/>#互动\\n\<br/>    pod 'BPMessageCenterLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPMessageCenterLib.git', :tag => '0.9.04'\\n\<br/>    pod 'BPVShortLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPVShortLib.git', :tag => '0.9.04'\\n\<br/>    pod 'BPPushLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPPushLib.git', :tag => '0.5.06'\\n\<br/>    pod 'BPYCommentLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPYCommentLib.git', :tag => '0.9.01'\\n\<br/>    pod 'BPKCommumityLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPKCommumityLib.git', :tag => '0.9.04'\\n\<br/>#用户\\n\<br/>    pod 'BPPersonalCenterLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPPersonalCenterLib.git', :tag => '0.9.1'\\n\<br/>    pod 'BPCarServiceLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPCarServiceLib.git', :tag => '0.9.1'\\n\<br/>    pod 'BPSearchLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPSearchLib.git', :tag => '0.8.29'\\n\<br/>    pod 'BPLoginLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPLogininLib.git', :tag => '0.8.6'\\n\<br/>#架构\\n\<br/>    pod 'BPWelfareLib',:git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPWelfareLib', :tag => '0.7.3'\\n\<br/>    pod 'BPFlutter', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPFlutter.git', :tag => '0.1.4'\\n\<br/>#淘车 \\n\<br/>    pod 'BPTaocheLib', :git => 'http:\/\/gitlab.companydomain.com\/WP\/Mobile\/IOS\/BPTaocheLib.git', :tag => '0.2.0'\\n\<br/>#ShellPodsEnd\\n\<br/>" |
| 描述     | -r    - Custom pods content 传入自定义的内容，只有当-p 为replace_section或replace_pods才会有效<br>        当p的值为network_replace_section:  内容为带替换的内容，斜杆需要在前面加反斜杠转义，最后加上<br>换行，同时加上\作为换行符保证参数的可读性<br>        当p的值为network_replace_pods:    内容为需要自定义的数组，例如 'BPWelfareLib,BPFlutter' |

## 构建

执行shell

~~~shell
cd /Users/companyaccount/Package
echo "cd /Users/companyaccount/bitTest/Package; ./package.sh -a $PACKAGE_APP_JENKINS -b $SHELL_BRANCH_JENKINS -c $UPLOAD_CHANNEL_JENKINS -p $CUSTOM_PODS_JENKINS -r $CUSTOM_PODS_CONTENT_JENKINS  -v " > ./tmp.command
chmod +x ./tmp.command
open ./tmp.command
 #./dynamicCommand.sh $channel $customPod
~~~



## 构建出发器

~~~
0 9 * * *
0 11 * * *
0 13 * * *
0 15 * * *
0 17 * * *
0 19 * * *
0 21 * * *
~~~



## Editable Email Notification

Default Subject

~~~sh
$DEFAULT_SUBJECT
~~~

Default Content

~~~html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${ENV, var="JOB_NAME"}-第${BUILD_NUMBER}次构建日志</title>
</head>
<body leftmargin="8" marginwidth="0" topmargin="8" marginheight="4" offset="0">
<table width="95%" cellpadding="0" cellspacing="0" style="font-size: 11pt; font-family: Tahoma, Arial, Helvetica, sans-serif">
<tr>
   <td>(本邮件是程序自动下发的，请勿回复！)</td>
</tr>
<tr>
   <td><h2><font color="#0000FF">构建结果 - ${BUILD_STATUS}</font></h2></td>
</tr>
<tr>
   <td><br /> <b><font color="#0B610B">构建信息</font></b> <hr size="2" width="100%" align="center" /></td>
</tr>
<tr>
<td>
     <ul>
          <li>项目名称&nbsp;：&nbsp;${PROJECT_NAME}</li>
          <li>构建编号&nbsp;：&nbsp;第${BUILD_NUMBER}次构建</li>
          <li>触发原因：&nbsp;${CAUSE}</li>
          <li>构建日志：&nbsp;<a href="${BUILD_URL}console">${BUILD_URL}console</a></li>
          <li>构建&nbsp;&nbsp;Url&nbsp;：&nbsp;<a href="${BUILD_URL}">${BUILD_URL}</a></li>
          <li>工作目录&nbsp;：&nbsp;<a href="${PROJECT_URL}ws">${PROJECT_URL}ws</a></li>
          <li>项目&nbsp;&nbsp;Url&nbsp;：&nbsp;<a href="${PROJECT_URL}">${PROJECT_URL}</a></li>
<li>下载地址： <a href="https://www.pgyer.com/AppName*****">蒲公英</a></li>
     </ul>
</td>
</tr>
<tr>
     <td><b><font color="#0B610B">版本号</font></b> <hr size="2" width="100%" align="center" /></td>
</tr>
<tr>
<td>
     <span>${BUILD_LOG_MULTILINE_REGEX,showTruncatedLines="false",regex="Pre-downloading: `(.*)"} </span>
</td>
</tr>
</table>
</body>
</html>
~~~



Attachments



~~~
Podfile.lock
~~~



# 遗留问题

碰到的问题是pod update 的过程当中，Pre-downloading

~~~
Pre-downloading: `xxxLib` from `http://gitlab.xxxxxxxxxxxxb.git`, tag `0.4.5`

[!] Error installing xxxLib
[!] Failed to download 'xxxLib'.
~~~

但是我远程登录到服务器

~~~shell
cd  ~/.jenkins/jobs/iOSxxxxx/workspace
pod update --verbose
~~~

打印出来的日志

~~~
  > Copying xxxxxxMessageCenterLib from `/Users/companyaccount/Library/Caches/CocoaPods/Pods/External/xxxxxxMessageCenterLib/ac0999518905dfaeb4412e75cb70102e` to `Pods/xxxxxxMessageCenterLib`
-> Pre-downloading: `xxxxxxNewsLib` from `http://gitlab.xxxxxx.com/WP/Mobile/IOS/xxxxxxNewsLib.git`, tag `0.4.5`
 > Git download
 > Git download
     $ /usr/bin/git clone http://gitlab.xxxxxx.com/WP/Mobile/IOS/xxxxxxNewsLib.git /var/folders/7w/q65n0jy56nq42f3k0nlfnbm00000gn/T/d20181228-23832-zemqsr --template= --single-branch --depth 1 --branch 0.4.5
     Cloning into '/var/folders/7w/q65n0jy56nq42f3k0nlfnbm00000gn/T/d20181228-23832-zemqsr'...
     Note: checking out 'a6be63cbda94bd367394c9f392b94a2a793b3b6d'.

     You are in 'detached HEAD' state. You can look around, make experimental
     changes and commit them, and you can discard any commits you make in this
     state without impacting any branches by performing another checkout.

     If you want to create a new branch to retain commits you create, you may
     do so (now or later) by using -b with the checkout command again. Example:

       git checkout -b <new-branch-name>

     Checking out files:  97% (6302/6496)   
     Checking out files:  98% (6367/6496)   
     Checking out files:  99% (6432/6496)   
     Checking out files: 100% (6496/6496)   
     Checking out files: 100% (6496/6496), done.
[!] Error installing xxxxxxNewsLib
[!] Failed to download 'xxxxxxNewsLib'.
~~~

虽然用到的文件是7M，但是pod update 会把整个目录都给拉下来，一整个目录一个多G，当然会失败了，后续继续观察，观察。

实践证明，在xxxxxxNewsLib 瘦身以后上述问题，依然没有解决， jekkins又是一个很好的调用本地脚本的方案，不能舍弃。

先描述一下现象

1. 直接在控制台运行脚本，OK
2. 如果news更新了，通过jekkins 执行脚本，不行
3. 在上述情况下，在控制台执行一遍，jekkins就好使了。

结合日志，都是挂在pod update 这一个命令上，结合输出的日志和cocoapods的源码，大体上知道了原因出在git clone 这一环节，一旦下载到本地缓存了，就不会走网络下载逻辑，直接走的是缓存逻辑。本地缓存可以通过 pod cache list 查看,通过 pod cache clean来清除。

我的思路是

1. 对比jekkins 和 命令行直接调用有什么环境差异，导致下载不成功
2. 对比 news 和别的库有什么差异。我发现我在命令行直接执行



顺着第一条路，我打印了一些书里列出的一些Git相关的环境变量

~~~shell
who am i
echo $0
echo $1
echo $2
git --exec-path
echo $HOME
echo $GIT_DIR
等

~~~

没看出啥差异





顺着第二条路，我在终端直接执行输出结果是

~~~shell
git clone http://gitlab.*******MessageCenterLib.git   messageCenter8 --template= --single-branch --depth 1 --branch 0.9.04 --verbose
Cloning into 'messageCenter8'...
POST git-upload-pack (196 bytes)
POST git-upload-pack (205 bytes)
remote: Counting objects: 3410, done.
remote: Compressing objects: 100% (2893/2893), done.
remote: Total 3410 (delta 517), reused 2846 (delta 429)
Receiving objects: 100% (3410/3410), 57.50 MiB | 3.01 MiB/s, done.
Resolving deltas: 100% (517/517), done.
Note: checking out 'c0a1d2edb9f1a476fc229df92be2c5a700fbf019'.

You are in 'detached HEAD' state. You can look around, make experimental
changes and commit them, and you can discard any commits you make in this
state without impacting any branches by performing another checkout.

If you want to create a new branch to retain commits you create, you may
do so (now or later) by using -b with the checkout command again. Example:

  git checkout -b <new-branch-name>

Checking out files: 100% (3795/3795), done.
~~~





~~~shell
git clone http://gitlab.bi******NewsLib.git  news8 --template= --single-branch --depth 1 --branch 0.9.05 --verbose
Cloning into 'news8'...
POST git-upload-pack (196 bytes)
POST git-upload-pack (205 bytes)
remote: Counting objects: 1328, done.
remote: Compressing objects: 100% (1226/1226), done.
remote: Total 1328 (delta 144), reused 1133 (delta 100)
Receiving objects: 100% (1328/1328), 3.43 MiB | 7.01 MiB/s, done.
Resolving deltas: 100% (144/144), done.
Note: checking out 'b41984e840493d536a9feff198b4ad04d5f4088a'.

You are in 'detached HEAD' state. You can look around, make experimental
changes and commit them, and you can discard any commits you make in this
state without impacting any branches by performing another checkout.

If you want to create a new branch to retain commits you create, you may
do so (now or later) by using -b with the checkout command again. Example:

  git checkout -b <new-branch-name>

~~~



我发现少了 Checking out files: 100% (3795/3795), done. 这一句输出，在加了 --verbose 不管用，因为Git 本来就支持调试日志的输出，我又加了一些变量，

~~~shell
GIT_TRACE=true GIT_TRACE_PACK_ACCESS=true GIT_TRACE_PACKET=true GIT_TRACE_PERFORMANCE=true GIT_TRACE_SETUP=true
~~~

没看出啥端倪，先立字为据，希望以后能有一个答案。



最后怎么解决这个问题的呢？同事搞定的，在jekkins调用.command 可以解决这个问题，于是我写了个脚本放到jekkins 里面,动态生成。

.command 应该是类似windows里面的.bat，直接双击就可以执行了，但是传参是一个问题man open 看了一下， - -args 应该是用来传参的，但是我试了一下不管用，看样子应该是直接传到main函数里面的，我也没有继续试了。最后，我用动态生成文件的办法解决了这个问题。

~~~shell
cd /Users/***/Package
echo "cd /Users/***/Package; ./autoPackage.sh $channel $customPod" > ./tmp.command
chmod +x ./tmp.command
open ./tmp.command

#本来也写了一个 因为customPod 是多行参数，所以暂时没有搞定
#./dynamicCommand.sh $channel $customPod
~~~



dynamicCommand.sh 如下

~~~shell
#!/bin/sh
pacage_path=$(cd `dirname $0`; pwd)
# [ 1:app-store 2:enterprise]
echo "cd $pacage_path; ./autoPackage.sh $1 $2" > ./tmp.command
chmod +x ./tmp.command
open ./tmp.command
#rm ./tmp.command
~~~





## 参考

1. [AutoPacking-iOS](https://github.com/stackhou/AutoPacking-iOS)
2. [archiveScript](https://github.com/kepuna/archiveScript)
