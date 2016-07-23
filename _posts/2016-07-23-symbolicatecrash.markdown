---
layout: post
title:  "符号化 iOS Crash 文件"
date:   2016-07-23 11:27:32 +0800
categories: iOS Debug 技巧
---
老生常谈，拾人牙慧，只是自己做个记录，方便以后查询。

**目录**

* [步骤一 find](#find)
* [步骤二 设置DEVELOPER_DIR](#set)
* [步骤三 使用symbolicatecrash](#use)
* [Others](#others)
	* [UUID的概念](#UUID)
	* [App的UUID](#AppUUID)
	* [dSYM文件中的UUID](#dSYMUUID)
	* [Crash文件中的UUID](#crashUUID)
* [Reference](#reference)


步骤一 find<a name="find"></a>
===
因为不同的Xcode版本这个工具的位置经常会变，所以用下面这个命令来寻找

~~~
➜  inhouseCrash find /Applications/Xcode.app -name symbolicatecrash -type f
/Applications/Xcode.app/Contents/SharedFrameworks/DVTFoundation.framework/Versions/A/Resources/symbolicatecrash
~~~

学会find命令，不变应万变。

步骤二 设置DEVELOPER_DIR<a name="set"></a>
===
~~~
➜  inhouseCrash export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
~~~
使用命令行工具symbolicatecrash

步骤三 使用symbolicatecrash<a name="use"></a>
===
.app, .crash, .dSYM, symbolicatecrash
把这四个文件放到一个文件夹内，执行

注意这次用的是dSYM

~~~
➜  inhouseCrash ./symbolicatecrash original.crash AppName.app.dSYM > dsym.crash
~~~

发现用AppName.app当参数也能得到想要的结果

~~~
➜  inhouseCrash ./symbolicatecrash original.crash AppName.app > app.crash
~~~

Others<a name="others"></a>
===
为什么会写这篇文章，原因是我用symbolicatecrash，一直不能得到想要的结果。继续深入了解了一下，原来是没有把.app .dSYM 和 .crash 对应上。

UUID的概念<a name="UUID"></a>
----
这里先介绍一个概念：UUID 。什么是UUID？每一个可执行程序都有一个build UUID来唯一标识。Crash日志包含发生crash的这个应用（app）的 build UUID以及crash发生的时候，应用加载的所有库文件的[build UUID]。

App的UUID<a name="AppUUID"></a>
----

~~~
➜  inhouseCrash xcrun dwarfdump --uuid AppName.app/AppName
UUID: 7E78F43B-9659-304F-B77D-102EE2520FB6 (armv7) AppName.app/AppName
UUID: 50AD720C-A916-3F53-B233-2099A2D7D306 (arm64) AppName.app/AppName
~~~

dSYM文件中的UUID<a name="dSYMUUID">
----

~~~
➜  inhouseCrash xcrun dwarfdump --uuid AppName.app.dSYM
UUID: 7E78F43B-9659-304F-B77D-102EE2520FB6 (armv7) AppName.app.dSYM/Contents/Resources/DWARF/AppName
UUID: 50AD720C-A916-3F53-B233-2099A2D7D306 (arm64) AppName.app.dSYM/Contents/Resources/DWARF/AppName
~~~


后来发现直接用dwarfdump就可以不用xcrun 也能得到想要的结果

~~~
➜  inhouseCrash dwarfdump --uuid AppName.app.dSYM
~~~


Crash文件中的UUID<a name="crashUUID"></a>
----

~~~
➜  inhouseCrash grep "uuid" app.crash
{"app_name":"AppName","timestamp":"2016-07-22 16:32:22.22 +0800","app_version":"5.9","slice_uuid":"50ad720c-a916-3f53-b233-2099a2d7d306","adam_id":0,"build_version":"5.9.0.1","bundleID":"com.XXOOipad","share_with_app_devs":false,"is_first_party":false,"bug_type":"109","os_version":"iPhone OS 9.2 (13C75)","name":"AppName"}
~~~

注意这三个50AD720C-A916-3F53-B233-2099A2D7D306是可以对应起来的



Reference
===
- [分析iOS Crash文件：符号化iOS Crash文件的3种方法](http://www.cocoachina.com/industry/20140514/8418.html
)
- [iOS Crash文件的解析（一）](http://www.cnblogs.com/smileEvday/p/Crash1.html)


