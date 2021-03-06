---

layout: post
title:  "给iOS App瘦身"
date:   2019-9-19 17:24:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS优化
---



最近打算给App瘦身，做一个简单的步骤整理。

# 编译选项

待补充



# 资源瘦身

1.  删除无用图片，已做自定义,介绍文章，看上篇 [删除无用图片工具定制]({{ site.url }}/ios/2019/09/19/iOS-LSUnusedResources/) 
2. 删除重复图片，用 [SameCodeFinder](https://github.com/toolazytoname/SameCodeFinder) 这是用来找相似代码的，也可以用来找一样的图片。重复图片以图标居多，解决方案看下一条。别的重复图片背后都是往往是一个可以下沉的一个公用组件。
3. 如果是纯色图标，用如下方案[在iOS中使用icon font]([**http://www.cocoachina.com/articles/7327**](http://www.cocoachina.com/articles/7327)) 业内有现成的[开源库IconFont](https://github.com/JohnWong/IconFont) 。这个库挺好的，规避了这种方案的缺点，
   1. 比如不会直接用Unicode，不知道字面含义，会有一个字典管理映射关系
   2. 字体生成UIImage，用label 代替总觉得有点怪怪的。
4. 启动图可以优化，用一个storyboard 来代替 ，具体参看[launch-screen-storyboard]( http://useyourloaf.com/blog/using-a-launch-screen-storyboard/ ) `One piece of this is the ability to generate Storyboard-based Launch Images in Xcode 6 and iOS 8, leaving behind the notion of individual images for each device type`[出自](http://martiancraft.com/blog/2014/09/vector-images-xcode6/)
5. 对现有图片按大小排个序，有些背景纯色图，或者渐变色图，可以用代码绘制，也可以合理利用 局部拉伸API
6. 对非必须的资源，尽量从网络获取
7. 如果非要放图，可以 合理利用 `asset` ，放一个pdf，减少设计工作量。不用每次都生成`@2x`和`@3x`图。因为在编译过程中已经会自动生成。` Another piece of this technology is the ability to generate vector-based images from a PDF at build-time in Xcode 6.`。用这种方式确实可以瘦，可以自己下一个[ThemeEngine ](https://github.com/alexzielenski/ThemeEngine) 打开项目里面的Assets.car看看。用另一个工具[cartool ](https://github.com/steventroughtonsmith/cartool) 也可以。
8. 放在Images.xcassets的图片不能通过imagesWithContentsOfFile:来加载。（因为这个方法相当于是去mainBundle里面找图片，但是这些图片都被打包进了Assets.car文件）会占内存。那么我们会放bundle 里，这时候如果有追求，可以试试`WebP`格式的图片，以时间换空间。
9. 如果还是使用png，记得压缩。我用的是[imageoptim](https://imageoptim.com/mac)，推荐无损压缩，建议设计出图最好。



# 代码瘦身

1. [查找相似代码文件](https://github.com/toolazytoname/SameCodeFinder)
2. 无用代码，大多数方案不能排除出runtime调用的类，会有误判。下面是业内常用的方案

| 方案          |      文档       | 代码 |
| :------------ | :-------------: | ------------: |
| Link Map File 结合 Mac-O | [iOS微信安装包瘦身](https://mp.weixin.qq.com/s?__biz=MzAwNDY1ODY2OQ==&mid=207986417&idx=1&sn=77ea7d8e4f8ab7b59111e78c86ccfe66&3rd=MzA3MDU4NTYzMw==&scene=6#rd) | [检查每个类占用空间大小工具](https://github.com/toolazytoname/LinkMap) |
| clang      |    [基于clang插件的一种iOS包大小瘦身方案](https://mp.weixin.qq.com/s?__biz=MzUxMzcxMzE5Ng==&mid=2247488360&idx=1&sn=94fba30a87d0f9bc0b9ff94d3fed3386&source=41#wechat_redirect) [如何使用 Clang Plugin 找到项目中的无用代码](https://blog.gocy.tech/2017/09/12/DetectingUselessCodeWithClang-p1/)     |           [XcodeZombieCode](https://github.com/kangwang1988/XcodeZombieCode) |
| 源码解析? |    无     |           [fui](https://github.com/dblock/fui)跑通了这个方案，但是目前不支持动态调用|
| 源码解析？ | [使用Swift3开发了个MacOS的程序可以检测出objc项目中无用方法，然后一键全部清理](https://www.jianshu.com/p/a53480ad0364) | [SMCheckProject](https://github.com/ming1016/SMCheckProject.git) 难道我是时候重温一下swift了？？ |


使用脚本

`fui --path=/Users/yiche/Code/weichao/BitAutoPlus find >unusedclass.txt`

~~~
grep BPNewsLib  unusedclass.txt | grep -v Cell | grep -v BPNBundle | grep -v BPTMediator | grep -v  Pods/Headers/  > news.txt
~~~

未完待续，会产出一个结合运行时判断工具。


