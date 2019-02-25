---

layout: post
title:  "flutter 初尝"
date:   2019-2-14 11:01:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS
---



# 效果

照着文档试了一下flutter，实现了以下功能。集成进App的方式不太优雅，需要手动修改很多配置，如果集成进来，打包脚本也需要做相应的修改。



1. 完整独立的App，hello world
2. 引入外部包，扩展功能
3. 完成了意见widget，列表展示
4. dart 网络请求，使用  import 'package:http/http.dart' as http;
5. json 解析
6. 性能问题
7. 动态下发，不支持
8. 集成进现有App，同时支持Hot Reload
9. 原生页面和现有页面交互，参数传递。方法相互调用
10. 不支持动态下发
11. 手势？还没试



# 坑

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





# 参考

1. 定性

   1. [解密谷歌开发的第三个操作系统——Fuchsia](https://mp.weixin.qq.com/s/a8TzBUQhhQI21XxzuUGbHA)
   2. [如何评价 Google 的 Fuchsia、Android、iOS 跨平台应用框架 Flutter？](https://www.zhihu.com/question/50156415)

2. 对比

   1. [移动端跨平台开发的深度解析](https://juejin.im/post/5b395eb96fb9a00e556123ef )

3. 文档

   1. [官方文档](https://flutter.io/docs/get-started/codelab)
   2. [包地址](https://pub.dartlang.org/flutter/packages?q=json)
   3. [Using Flutter in China](https://flutter.io/community/china)
   4. [文档中文翻译](https://flutterchina.club/)

4. FAQ

   1. [What devices and OS versions does Flutter run on?](https://flutter.io/docs/resources/faq#what-devices-and-os-versions-does-flutter-run-on)
   2. [How big is the Flutter engine?](https://flutter.io/docs/resources/faq#how-big-is-the-flutter-engine)
   3. [What kind of app performance can I expect?](https://flutter.io/docs/resources/faq#what-kind-of-app-performance-can-i-expect)
   4. [Can I use Flutter inside of my existing native app?](https://flutter.io/docs/resources/faq#can-i-use-flutter-inside-of-my-existing-native-app)
   5. [Can I interop with my mobile platform’s default programming language?](https://flutter.io/docs/resources/faq#can-i-interop-with-my-mobile-platforms-default-programming-language)
   6. [Can I use JSON/XML/protobuffers, etc. with Flutter?](https://flutter.io/docs/resources/faq#can-i-use-jsonxmlprotobuffers-etc-with-flutter)

5. 实践

   1. [[!] Invalid `Podfile` file: [!] Specifying multiple `post_install` hooks is unsupported..](https://github.com/flutter/flutter/issues/26212)
   2. [iOS混编Flutter优化&注意](https://www.jianshu.com/p/0ec95723909c)
   3. [Flutter: PhaseScriptExecution failed with a nonzero exit code](https://www.jianshu.com/p/3106715ea9a3)
   4. [使用Flutter之后，我们的CPU占用率降了50%](https://mp.weixin.qq.com/s/NtwHJLwMigNG-SSr9DDDIQ)

6. 原理

   1. [Flutter原理与美团的实践](https://www.jianshu.com/p/e6cd8584fdbb?utm_campaign=maleskine&utm_content=note&utm_medium=seo_notes&utm_source=recommendation)
   2. [Flutter新锐专家之路：工程研发体系篇](https://www.jianshu.com/p/5ffc83904971?utm_campaign=maleskine&utm_content=note&utm_medium=seo_notes&utm_source=recommendation)

   1. [深入理解flutter的编译原理与优化](https://yq.aliyun.com/articles/604052)
