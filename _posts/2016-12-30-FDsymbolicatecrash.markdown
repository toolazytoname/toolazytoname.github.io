---
layout: post
title:  "定制symbolicatecrash"
date:   2016-12-08 16:35:32 +0800
categories: FDTool
---

WiiU 破解。

**目录**

* [0 前言](#preface)
* [1 待完善](#TODO)


# 0 前言<a name="preface"></a>

因为同事经常手工命令行解析日志，比较费劲。所以我写了这个脚本可以很大程度上提升他的工作效率，简单封装了一下symbolicatecrash。
[源码](https://github.com/toolazytoname/FDsymbolicatecrash)


# 1 待完善<a name="TODO"></a>

1. 对于解析不出来的日志文件，可以再调用atos，逐行解析能解析的内容
2. 可以比较一下dSYM文件的uuid和crash文件的uuid，如果发现不一样，可以做一个提示。


