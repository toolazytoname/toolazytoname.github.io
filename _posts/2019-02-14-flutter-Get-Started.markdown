---

layout: post
title:  "Flutter集成初体验"
date:   2019-2-14 11:01:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS
---



# 官方集成方案

在Flutter 的FAQ里面有这么一个问题

### Can I use Flutter inside of my existing native app?

Yes, you can embed a Flutter view in your existing Android or iOS app, however our tooling is currently not fully optimized for this use case (see [issue #14821](https://github.com/flutter/flutter/issues/14821) for details).

Two current demonstrations of this are the [platform_view](https://github.com/flutter/flutter/tree/master/examples/platform_view) and [flutter_view](https://github.com/flutter/flutter/tree/master/examples/flutter_view) examples. Some initial documentation is available in the wiki page [Add Flutter to existing apps](https://github.com/flutter/flutter/wiki/Add-Flutter-to-existing-apps).

看了才发现，Google官方对这一点支持的不太友好，能实现，但过程极度不优雅。国内有几篇文章都分享了如何优雅集成，

* [闲鱼flutter混合工程持续集成最佳实践]([**https://www.yuque.com/xytech/flutter/pfoy9x**](https://www.yuque.com/xytech/flutter/pfoy9x))

* [Now直播iOS Flutter混合工程实践](https://juejin.im/post/5b6cea3c6fb9a04fca3ca608)

* [使用Flutter之后，我们的CPU占用率降了50%](https://mp.weixin.qq.com/s/NtwHJLwMigNG-SSr9DDDIQ)

* [从零搭建 iOS Native Flutter 混合工程 ]([**https://juejin.im/post/5c3ae5ef518825242165c5ca**](https://juejin.im/post/5c3ae5ef518825242165c5ca))
  * 这篇比较详细，还发了打包脚本的源码



# 集成方案选择

官方的集成主要有两点不太合理

### 缺点1. 主工程的设置
我需要在主工程上，增加一个Run Script，同时在Podfile 里面增加一段设置脚本。因为不会是所有的同事都参与到Flutter 开发过程中，总不能让所有iOS开发都安装Dart环境吧。另外，如果采用这种方案，打包脚本也得改，打包机上还得配置Dart 环境。

### 缺点2. AppDelegate 中增加代码
我的想法是尽量不要在AppDelegate 中增加代码逻辑。如果去掉Flutter了，除了改动引用flutterViewController的地方， 还得去这里改代码。

## 目标
把所有的Flutter相关的逻辑，都集成到一个pod里面，对外暴露的多个ViewController，对主工程来说，就是一个ViewController而已。如果去掉Flutter，只是在Podfile里面去掉这个pod，不需要在别的地方额外设置。

## 实现方式

~~~ruby
  info_plist_files = 'iosbp/build_ios/release/product/Flutter/App.framework/Info.plist', 'iosbp/build_ios/release/product/Flutter/Flutter.framework/Info.plist'
#用官方的集成方案会有很多个pod，每一个第三方组件都会是一个pod，我把所有这些都集成为一个pod
# 前面的这个文件是所有的第三方插件源码，后面是Flutter对外暴露的viewcontroller，对主工程来说，就是一个普通的ViewController而已。
  s.source_files = 'iosbp/build_ios/release/product/**/*','iosbp/BPFlutter/Classes/**/*.{h,m}'
#如果保留App.framework 和Flutter.framework 里面的Info.plist会报错，error: Multiple commands produce '/Info.plist’；
#删了呢，又会报错App installation failed，Could not inspect the application package.
#用下面这种方式可以解决
  s.exclude_files = info_plist_files
  s.vendored_frameworks = 'iosbp/build_ios/release/product/Flutter/*.framework'
~~~

podspec 写成这样以后，打包脚本得加入如下逻辑,为了让第三方插件的源码，也放在当前pod。

~~~shell
#改造
#SharedPreferencesPlugin.m 文件中去掉尖括号
#import <shared_preferences/SharedPreferencesPlugin.h>
#替换为
#import "SharedPreferencesPlugin.h"
#

    sed -i '' -e 's/<.*\/\(.*\)>/\"\1\"/g' ${PRODUCT_PATH}/GeneratedPluginRegistrant.m

~~~

后面列一下目前为止，已解决的和未解决的一些坑

# 按照官方文档集成碰到的坑

## multiple post_install
Invalid `Podfile` file: [!] Specifying multiple `post_install` hooks is unsupported
查看issue发现了原因，并且手动修改。

具体解决方法请参考以下链接。

[[!] Invalid `Podfile` file: [!] Specifying multiple `post_install` hooks is unsupported..](https://github.com/flutter/flutter/issues/26212)

## PhaseScriptExecution failed

目前把"$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh" embed
这句话注释掉就可以了

## flutter_assets 需要手动引入

~~~shell
# 删除本地Flutter文件夹
rm -rf -- "$SOURCE_ROOT/Flutter"
# 再生成Flutter文件夹
mkdir -p "$SOURCE_ROOT/Flutter"

# 编译生成
"$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh" build

# 将胶水文件copy到本地文件夹
cp -r -- "$FLUTTER_APPLICATION_PATH/.ios/Flutter/flutter_assets" "$SOURCE_ROOT/Flutter"
cp -r -- "$FLUTTER_APPLICATION_PATH/.ios/Flutter/App.framework" "$SOURCE_ROOT/Flutter"
~~~



## 上架提交商店报错解决

~~~shell
if [[ "$CONFIGURATION" =~ "Release" ]];then
# Release环境删除Flutter.framework "x86_64" 框架
lipo -remove "x86_64" "$FLUTTER_APPLICATION_PATH/.ios/Flutter/engine/Flutter.framework/Flutter" -output "$FLUTTER_APPLICATION_PATH/.ios/Flutter/engine/Flutter.framework/Flutter"
fi
~~~



同时为了能在模拟器上编译通过，我用脚本增加了条件编译

~~~shell
function travFolder()
{
  for file in `ls $1`
  do
    local path=$1"/"$file
    if [ -d $path ]
     then
      # 跳过framework
      if [ "${path##*.}" != "framework" ]; then
        travFolder $path
      fi
    else
      add_compile_condition $path
    fi
  done
}

function add_compile_condition() {
  filename=$1
  if [ "${filename##*.}" = "h" -o "${filename##*.}" = "m" ]; then
    echo "add compile condition in file $1"
    # sed -i '1 #if !TARGET_OS_SIMULATOR' - $1
    echo -e "#if !TARGET_OS_SIMULATOR\n`cat $1`" >$1
    echo "#endif">>$1
  fi
}

~~~



五花八门坑

## 在iOS 9 上启动崩溃

GitHub 上面有一个[issue](https://github.com/flutter/flutter/issues/30834)

在iOS 9 上启动崩溃，debug不崩溃，把线拔掉，重启，崩溃.崩溃输出的堆栈在上面这个issue 里面都有。

事后用otool -l /path/to/App 对比了一下输出结果，有问题的那个App确实没有如下这个Load command。

~~~shell
Load command 10
          cmd LC_LOAD_DYLIB
      cmdsize 56
         name /usr/lib/libSystem.B.dylib (offset 24)
   time stamp 2 Thu Jan  1 08:00:02 1970
      current version 1252.200.5
compatibility version 1.0.0
~~~



##  App installation failed，Could not inspect the application package.error: Multiple commands produce '/Info.plist’

如果保留App.framework 和Flutter.framework 里面的Info.plist会报错，error: Multiple commands produce '/Info.plist’；

删了呢，又会报错App installation failed，Could not inspect the application package.

更可恶的是如果保留Info.plist， 

~~~ruby
#在主工程的podfile 里面，路径指向本地没问题，
pod 'BPFlutter', :path => '../BPFlutter'
#指向远端 就报错
pod 'BPFlutter', :git => 'http://gitlab.*****.com/WP/Mobile/IOS/BPFlutter.git', :tag => '0.1.4'
~~~

**有一个解决方案是，直接把Xcode 10 新升级的**构建系统起名“New Build System”（新构建系统），切换回旧的构建系统称为 legacy build system （传统构建系统）。

但其实不用这么操作，在Podfile里面这设置就可以了

~~~ruby
  info_plist_files = 'iosbp/build_ios/release/product/Flutter/App.framework/Info.plist', 'iosbp/build_ios/release/product/Flutter/Flutter.framework/Info.plist'
  s.source_files = 'iosbp/build_ios/release/product/**/*','iosbp/BPFlutter/Classes/**/*.{h,m}'
  s.exclude_files = info_plist_files
  s.vendored_frameworks = 'iosbp/build_ios/release/product/Flutter/*.framework'
~~~

简单说，就是这个info.plist文件目录里要有,但是得排除出去。有谁知道原因吗？



## Initial route 的问题,初始化传参

参看这个[issue](https://github.com/flutter/flutter/issues/27216),就可以解决了。



未解决：

## 如果iOS有一个UIScrollview 套一个 flutter 的ListView。手势会有冲突。

[Issue](https://github.com/flutter/flutter/issues/27071) 

目前最好的解决方案是外部实现一个UIScrollview子类，添加如下方法。

~~~objective-c
- (BOOL)gestureRecognizerShouldBegin:(UIPanGestureRecognizer *)panGestureRecognizer{
//    当在Flutter页面
    if ([self bpw_currentVisibleIndex] == FlutterIndex) {
        CGPoint velocity = [panGestureRecognizer velocityInView:panGestureRecognizer.view];
        //检测到手势是横滑的，外部scrollview应该接受这个手势的相应，反之
        BOOL isHorizonPan = fabs(velocity.x) > fabs(velocity.y);
        return isHorizonPan;
    }
    return YES;
}

~~~

缺点是，如果Flutter的ListView如果本身就有横滑的区域，isHorizonPan判断条件，就不好使了。

Flutter native ，同时断点调试，未实现。


# 参考

文档

1. [官方文档](https://flutter.io/docs/get-started/codelab)
2. [包地址](https://pub.dartlang.org/flutter/packages?q=json)
3. [Using Flutter in China](https://flutter.io/community/china)
4. [Flutter中文网](https://flutterchina.club/) [《Flutter实战》](https://book.flutterchina.club/)
5. [flutter 社区中文资源](https://flutter-io.cn)
6. [json_serializable库转换工具](https://caijinglong.github.io/json2dart/index_ch.html)
7. [Dart 语法](http://codingdict.com/article/22000) [DartPad](https://www.dartlang.org/tools/dartpad) 
8. [翻页](https://marcinszalek.pl/flutter/infinite-dynamic-listview/)