---

layout: post
title:  "无用图片定制"
date:   2019-9-19 16:47:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS优化
---





[LSUnusedResources](https://github.com/toolazytoname/LSUnusedResources) 是一个删除iOS工程中不用的图片的一个工具，用了好多次了，一直没有深入了解。这回再用，顺便看了一下它的源码，并且根据项目的要求，做了些改动，力求输出结果更加精准。

## 现有逻辑

我看文档写得挺简单的，补充些从源码得到的逻辑

1. 所有的设置都会存在NSUserDefaults 里，下次打开还会是上次的设置
2. 文件后缀对应正则设置，这个是一个字典，所以，不要重复添加。在这里设置的正则，会匹配出对应后缀名的文件。匹配的结果会放在 `[ResourceStringSearchersharedObject].resStringSet)`     这个集合里面，可以打印出来看一下。
3. 代码会遍历目录，获取图片资源。查找的结果会放到 `[ResourceFileSearchersharedObject].resNameInfoDict` 这是一个字典，key为去除后缀的图片的名字，value 是一个封装图片信息的对象。
4. ignore similar 很好使，逻辑在`containsSimilarResourceName` 方法里，起作用的是这个正则`([-_]?\\d+)`



# 自定义部分

我做了如下修改

1. 将json 匹配的正则改为 `\"(.*?)\”` ，其实我不太明白 为什么点的后面需要一个星和问号去重复修饰

2. 增加了一个自定义区域，对应的代码在`containsCustomResourceName:(NSString*)name regexStr:(NSString*)regexStr`里面，可以进一步输入自定义的正则，做进一步筛选。

   

   在我的项目中，会有这么些图片，图片名为 `ic_paihang_xjc_press@3x.png`  或者 `    ic_paihang_xsuv_nor@2x.png `用来表示一个按钮的两个状态，代码里面是这么写的

   ~~~objective-c
   - (NSArray *)subSuvArray {
       if (!_subSuvArray) {
           _subSuvArray = @[
                            @{@"title":@"小型",
                              @"image":@"ic_paihang_xsuv",
                              @"subimage":@"ic_paihang_xsuv",
                              @"level":@(13)},
                            @{@"title":@"紧凑型",
                              @"image":@"ic_paihang_jcsuv",
                              @"subimage":@"ic_paihang_jcsuv",
                              @"level":@(14)},
                            @{@"title":@"中型",
                              @"image":@"ic_paihang_zsuv",
                              @"subimage":@"ic_paihang_zsuv",
                              @"level":@(15)},
                            @{@"title":@"中大型",
                              @"image":@"ic_paihang_zdsuv",
                              @"subimage":@"ic_paihang_zdsuv",
                              @"level":@(16)},
                            @{@"title":@"全尺寸",
                              @"image":@"ic_paihang_suvall",
                              @"subimage":@"ic_paihang_suvall",
                              @"level":@(17)}];
       }
       return _subSuvArray;
   }
   ~~~

   

正在我无可奈何之际，无意间发现强大的正则竟然兼容这种匹配`exp前面的位置`这种模式，名曰 `零宽断言`。好吧，我从界面到model一路加了一个文本框，用来匹配这种自定义的情况，正则是`(?=_nor)|(?=_press)`

如果你也碰到了类似的问题，可以在文本框输入自己的正则。

代码在[LSUnusedResources]( https://github.com/toolazytoname/LSUnusedResources) 还请不吝赐教。

​	


