---
layout: post
title:  "谁动了我的奶酪"
date:   2016-05-19 17:27:32 +0800
categories: FDSDK
---

因为项目中集成了各个部门的不同模块，有一次调试偶发的bug，发现设备屏幕自动变暗了，明明设置了[UIApplication sharedApplication].idleTimerDisabled 这个属性了，猜测是集成的哪个别的部门的模块动了这个属性。


灵光一现，我写了个KVO去监听这个属性，谁动了它，我就把它的函数调用栈给打出来。复现即解决。😄

事后，简单整理了一下，写了一个类，[FDDebugObserver](https://github.com/toolazytoname/FDDebugObserver)奉上。
