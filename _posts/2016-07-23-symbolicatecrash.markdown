---
layout: post
title:  "符号化 iOS Crash 文件"
date:   2016-07-23 11:27:32 +0800
categories: iOS
tags:
  - iOS
---
老生常谈，拾人牙慧，只是自己做个记录，方便以后查询。

**目录**

* [步骤一 find](#find)
* [步骤二 设置DEVELOPER_DIR](#set)
* [步骤三 使用symbolicatecrash](#use)
* [步骤四 使用atos](#atos)
* [Others](#others)
	* [UUID的概念](#UUID)
	* [App的UUID](#AppUUID)
	* [dSYM文件中的UUID](#dSYMUUID)
	* [Crash文件中的UUID](#crashUUID)
	* [dSYM是什么鬼](#dSYM)
	* [如何寻找dSYM](#finddSYM)
	* [频繁唤醒异常crash文件](#wakeup)
	* [内存占用过多的crash文件](#memory)
	* [内存分类](#memorytype)
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

步骤四 使用atos<a name="atos"></a>
===
用了上面的方法，可能只是部分符号化了。有的时候，需要手工解析一下。

~~~
Thread 0 name:  Dispatch queue: com.apple.main-thread
Thread 0:
0   libsystem_kernel.dylib        	0x0000000196220e0c 0x196220000 + 3596
1   libsystem_kernel.dylib        	0x0000000196220c84 0x196220000 + 3204
2   CoreFoundation                	0x000000018444f720 0x184370000 + 915232
3   CoreFoundation                	0x000000018444d674 0x184370000 + 906868
4   CoreFoundation                	0x00000001843792d0 0x184370000 + 37584
5   GraphicsServices              	0x000000018da4f6f8 0x18da44000 + 46840
6   UIKit                         	0x0000000188f3efa8 0x188ec8000 + 487336
7   AppName                   	   	0x00000001000be2d4 main (main.m:13)
8   libdyld.dylib                 	0x0000000196122a04 0x196120000 + 10756


Binary Images:
0x1000a8000 - 0x10203bfff AppName arm64  <3075c4be517b30a78f98cdb16e7bc4ac> /var/mobile/Containers/Bundle/Application/5AE5E4AA-11ED-4301-AC07-54ED50C72E7D/AppName.app/SOHUVideoHD

~~~

用这个方法可以符号化任何一个地址，前提是能找到对应的dSYM文件，文章后面有提到[如何寻找dSYM](#finddSYM)。

参考格式

~~~
atos -arch <Binary Architecture> -o <Path to dSYM file>/Contents/Resources/DWARF/<binary image name> -l <load address> <address to symbolicate>

~~~

填进参数

~~~
atos -arch arm64 -o AppName.app.dSYM/Contents/Resources/DWARF/AppName -l 0x1000a8000 0x00000001000be2d4
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


如何寻找dSYM<a name="finddSYM"></a>
----

用一下方法，如果本地有这个文件，就可以通过UUID找到。

参数来源

参考

~~~
$ grep --after-context=1000 "Binary Images:" <Path to Crash Report> | grep <Binary Name>

~~~

填进去参数。

~~~
grep --after-context=1000 "Binary Images:" original.crash | grep AppName
0x1000a8000 - 0x10203bfff AppName arm64  <3075c4be517b30a78f98cdb16e7bc4ac> /var/mobile/Containers/Bundle/Application/5AE5E4AA-11ED-4301-AC07-54ED50C72E7D/AppName.app/AppName

~~~

可以先用spotlight试试搜索

~~~
3075c4be517b30a78f98cdb16e7bc4ac
~~~

可以直接得到结果。



另一种方法是把uuid拿出来，转成大写，用横杆分成五组，8-4-4-4-12 (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)

用以下格式

~~~
mdfind "com_apple_xcode_dsym_uuids == <UUID>"
~~~

填进参数，就能找到这个dSYM文件

~~~
mdfind "com_apple_xcode_dsym_uuids == 3075C4BE-517B-30A7-8F98-CDB16E7BC4AC"
/Desktop/crack/AppName.app.dSYM
~~~

补充一下，用下面这个命令，可以找到本地所有的dSYM。

~~~
mdfind "com_apple_xcode_dsym_uuids == *"
~~~


频繁唤醒异常crash文件<a name="wakeup"></a>
----
关于这种异常，苹果[官方文档](https://developer.apple.com/library/content/technotes/tn2151/_index.html#//apple_ref/doc/uid/DTS40008184-CH1-STACKTRACE) 中有明确说明是Typically, this is caused by thread-to-thread communication

~~~
The exception subtype WAKEUPS indicates that threads in the process are being woken up too many times per second, which forces the CPU to wake up very often and consumes battery life.

Typically, this is caused by thread-to-thread communication (generally using peformSelector:onThread: or dispatch_async) that is unwittingly happening far more often than it should be. Because the sort of communication that triggers this exception is happening so frequently, there will usually be multiple background threads with very similar Backtraces - indicating where the communication is originating.
~~~
这种异常，用symbolicatecrash也是可以解析出来的。

[原始文件]({{ site.url }}/assets/symbolicatecrash_original.crash)

[解析结果文件]({{ site.url }}/assets/symbolicatecrash_dsym.crash)

项目名字已经批量替换成AppName，就这异常文件还能解析出来，着实让我很惊讶。

内存占用过多的crash文件<a name="memory"></a>
----
苹果[官方文档](https://developer.apple.com/library/content/technotes/tn2151/_index.html#//apple_ref/doc/uid/DTS40008184-CH1-STACKTRACE) 也有详细说明。
乍一看就是两个json。

专门有一章就是讲述如何理解Understanding Low Memory Reports。我照着一个异常文件比对了一下。和别的异常文件这种异常no backtraces仔细看了一下我的Page Size字段。下面是一个进程列表，包括

~~~
This table lists all running processes, including system daemons, at the time the low memory report was generated.
~~~

通过 [reason]字段可以得到原因，我发现我们的App是因为这个原因被系统舍弃的。

~~~
[per-process-limit]: The process crossed its system-imposed memory limit. Per-process limits on resident memory are established by the system for all applications. Crossing this limit makes the process eligible for termination.
~~~

~~~
"rpages" : 87862,
   "states" : [
     "audio",
     "frontmost",
     "resume"
   ],

~~~
占用内存87862*4K/1024=343M。这个算法，还得验证一下。

[内存文件]({{ site.url }}/assets/symbolicatecrash_memory.crash)

内存问题。解决办法，我目前知道的，有这么几个小点。以下内容展开可以单独开一篇文章了。

1. 静态分析 Analyze
2. 用instrument Leaks 工具可以查到Leaked memory。这个好查。
3. 用Allocations 工具 Mark Generation方法。检测 Abandoned memory 。麻烦。具体可以看[苹果官方的介绍](https://developer.apple.com/library/content/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/FindingAbandonedMemory.html#//apple_ref/doc/uid/TP40004652-CH80-SW1)和[WeRead团队博客的介绍](http://wereadteam.github.io/2016/02/22/MLeaksFinder/)
4. 有一些第三方工具，例如(FBAllocationTracker/FBMemoryProfiler/FBRetainCycleDetector)，MSLeakHunter，[MLeaksFinder](http://wereadteam.github.io/2016/02/22/MLeaksFinder/)，PLeakSniffer等等


内存分类<a name="memorytype"></a>
----
我看别人的博客写着

内存分三类,没看到官方的出处。

1. Leaked memory: Memory unreferenced by your application that cannot be used again or freed (also detectable by using the Leaks instrument).
2. Abandoned memory: Memory still referenced by your application that has no useful purpose.
3. Cached memory: Memory still referenced by your application that might be used again for better performance.


通过[苹果官方的文档](https://developer.apple.com/library/content/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/CommonMemoryProblems.html#//apple_ref/doc/uid/TP40004652-CH91-SW1)我看讲的比上面细。

* Overall Memory Use.
	* Monitor at a high level how your app uses memory and compare it to the memory usage of other active processes on the system. Look for areas of large or unexpected memory growth. See Monitor Memory Usage.
* Leaked Memory.
	* This is memory that was allocated at some point, but was never released and is no longer referenced by your app. Since there are no references to it, there’s now no way to release it and the memory can’t be used again. For example, suppose you’ve written an app that creates rectangle objects in a drawing, but never releases the objects when the drawing is closed. In this case, your app would leak more and more memory whenever a drawing containing rectangles is closed. To fix the leak, you need to figure out which object isn’t being released, and then update your app to release it at the appropriate time. See Find Memory Leaks.

* Abandoned Memory.
	* This is memory that your app has allocated for some reason, but it’s not needed and won’t be referenced. For example, suppose your app adds images to a cache after they’ve already been cached—using double the memory for the same images. Or, maybe your app maintains an array of objects in case you need to access them later, but you never actually do. Unlike leaked memory, abandoned memory like this is still referenced somewhere in your app. It just serves no purpose. Since it’s still technically valid, it’s more difficult for Instruments to identify and requires more detective work on your part to find. See Find Abandoned Memory.
* Zombies.
	* This is memory that has been released and is no longer needed, but your code still references it somewhere. For example, suppose your app contains an image cache. Once the cache has been cleared, your app shouldn’t attempt to refer to the images that it previously contained. Calls to these nonexistent images are considered zombies—references to objects that are no longer living. See Find Zombies.




Reference
===
- [分析iOS Crash文件：符号化iOS Crash文件的3种方法](http://www.cocoachina.com/industry/20140514/8418.html
)
- [iOS Crash文件的解析（一）](http://www.cnblogs.com/smileEvday/p/Crash1.html)
- [Understanding and Analyzing iOS Application Crash Reports](https://developer.apple.com/library/ios/technotes/tn2151/_index.html)
- [MLeaksFinder：精准 iOS 内存泄露检测工具](http://wereadteam.github.io/2016/02/22/MLeaksFinder/)

下面的文章，我目前也没好好看。看完了收获应该会很大。知识会比较系统成体系。

- [FindingAbandonedMemory](https://developer.apple.com/library/content/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/FindingAbandonedMemory.html#//apple_ref/doc/uid/TP40004652-CH80-SW1)
- [Advanced Memory Management Programming Guide.](https://developer.apple.com/library/content/documentation/Cocoa/Conceptual/MemoryMgmt/Articles/MemoryMgmt.html#//apple_ref/doc/uid/10000011i)
