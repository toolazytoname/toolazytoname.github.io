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
	* [dSYM是什么鬼](#dSYM)
* [Reference](#reference)


步骤一 find<a name="find"></a>
===

因为不同的Xcode版本这个工具的位置经常会变，所以用下面这个命令来寻找

~~~
 find /Applications/Xcode.app -name symbolicatecrash -type f
~~~

我的结果是

~~~
/Applications/Xcode.app/Contents/SharedFrameworks/DVTFoundation.framework/Versions/A/Resources/symbolicatecrash
~~~


学会find命令，不变应万变。

步骤二 设置DEVELOPER_DIR<a name="set"></a>
===
~~~
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
~~~
使用命令行工具symbolicatecrash

步骤三 使用symbolicatecrash<a name="use"></a>
===
.app, .crash, .dSYM, symbolicatecrash
把这四个文件放到一个文件夹内，执行

注意这次用的是dSYM

~~~
 ./symbolicatecrash original.crash AppName.app.dSYM > dsym.crash
~~~

发现用AppName.app当参数也能得到想要的结果

~~~
 ./symbolicatecrash original.crash AppName.app > app.crash
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
xcrun dwarfdump --uuid AppName.app/AppName
UUID: 7E78F43B-9659-304F-B77D-102EE2520FB6 (armv7) AppName.app/AppName
UUID: 50AD720C-A916-3F53-B233-2099A2D7D306 (arm64) AppName.app/AppName
~~~

dSYM文件中的UUID<a name="dSYMUUID">
----

~~~
xcrun dwarfdump --uuid AppName.app.dSYM
UUID: 7E78F43B-9659-304F-B77D-102EE2520FB6 (armv7) AppName.app.dSYM/Contents/Resources/DWARF/AppName
UUID: 50AD720C-A916-3F53-B233-2099A2D7D306 (arm64) AppName.app.dSYM/Contents/Resources/DWARF/AppName
~~~


后来发现直接用dwarfdump就可以不用xcrun 也能得到想要的结果

~~~
dwarfdump --uuid AppName.app.dSYM
~~~


Crash文件中的UUID<a name="crashUUID"></a>
----

~~~
grep "uuid" app.crash
{"app_name":"AppName","timestamp":"2016-07-22 16:32:22.22 +0800","app_version":"5.9","slice_uuid":"50ad720c-a916-3f53-b233-2099a2d7d306","adam_id":0,"build_version":"5.9.0.1","bundleID":"com.XXOOipad","share_with_app_devs":false,"is_first_party":false,"bug_type":"109","os_version":"iPhone OS 9.2 (13C75)","name":"AppName"}
~~~

注意这三个50AD720C-A916-3F53-B233-2099A2D7D306是可以对应起来的

dSYM是什么鬼<a name="dSYM"></a>
----
[定性认知](http://stackoverflow.com/questions/22460058/how-is-a-dsym-file-created)
摘抄如下，说得很好：

A dSYM file is a "debug symbols file". It is generated when the "Strip Debug Symbols" setting is enabled in the build settings of your project.

When this setting is enabled, symbol names of your objects are removed from the resulting compiled binary (one of the many countermeasures to try and prevent would be hackers/crackers from reverse engineering your code, amongst other optimisations for binary size, etc.).

dSYM files will likely change each time your app is compiled (probably every single time due to date stamping), and have nothing to do with the project settings.

They are useful for re-symbolicating your crash reports. With a stripped binary, you won't be able to read any crash reports without first re-symbolicating them. Without the dSYM the crash report will just show memory addresses of objects and methods. Xcode uses the dSYM to put the symbols back into the crash report and allow you to read it properly.

具体分析参照这篇文章[iOS dSYM文件结构剖析（上）
](http://www.csdn.net/article/2015-08-04/2825369)

也可以直接用 dwarfdump 解析整个dSYM文件看看,大概就是这个德行

~~~
----------------------------------------------------------------------
 File: AppName.app.dSYM/Contents/Resources/DWARF/AppName (armv7)
----------------------------------------------------------------------
.debug_info contents:

0x00000000: Compile Unit: length = 0x00004c46  version = 0x0002  abbr_offset = 0x00000000  addr_size = 0x04  (next CU at 0x00004c4a)

0x0000000b: TAG_compile_unit [1] *
             AT_producer( "Apple LLVM version 7.3.0 (clang-703.0.31)" )
             AT_language( DW_LANG_ObjC )
             AT_name( "/Users/userName/Documents/ios/iPadVideo/Class/PersonalCenter/SVZBar/SVZBarViewController.m" )
             AT_stmt_list( 0x00000000 )
             AT_comp_dir( "/Users/userName/Documents/ios/iPadVideo" )
             AT_APPLE_major_runtime_vers( 0x02 )
             AT_low_pc( 0x00008200 )
             AT_high_pc( 0x0000cab0 )

0x00000027:     TAG_pointer_type [2]
                 AT_type( {0x0000002c} ( NSString ) )

0x0000002c:     TAG_structure_type [3] *
                 AT_name( "NSString" )
                 AT_byte_size( 0x04 )
                 AT_decl_file( "/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/System/Library/Frameworks/Foundation.framework/Headers/NSString.h" )
                 AT_decl_line( 70 )
                 AT_APPLE_runtime_class( 0x10 )

0x00000035:         TAG_inheritance [4]
                     AT_type( {0x0000004b} ( NSObject ) )
                     AT_data_member_location( +0 )

0x0000003d:         TAG_APPLE_Property [5]
                     AT_APPLE_property_name( "length" )
                     AT_type( {0x00000078} ( NSUInteger ) )
                     AT_decl_file( "/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/System/Library/Frameworks/Foundation.framework/Headers/NSString.h" )
                     AT_decl_line( 76 )
                     AT_APPLE_property_attribute( 0x0101 ( DW_APPLE_PROPERTY_readonly )  )
~~~


Reference
===
- [分析iOS Crash文件：符号化iOS Crash文件的3种方法](http://www.cocoachina.com/industry/20140514/8418.html
)
- [iOS Crash文件的解析（一）](http://www.cnblogs.com/smileEvday/p/Crash1.html)
- [Understanding and Analyzing iOS Application Crash Reports](https://developer.apple.com/library/ios/technotes/tn2151/_index.html)

