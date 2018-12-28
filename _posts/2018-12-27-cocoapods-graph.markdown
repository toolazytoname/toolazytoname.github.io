---
layout: post
title:  "cocoapods依赖关系导出"
date:   2018-12-27 15:46:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS 
---



# cocoapods依赖关系导出

其实Podfile.lock藏满了，各个版本库的版本号信息和彼此的依赖关系。



## [cocoapods-graph](https://pypi.org/project/cocoapods-graph/)

Installing

~~~shell
[sudo] pip install cocoapods-graph
~~~

How to use

~~~shell
cocoapods-graph -f Podfile.lock --html
~~~

## [cocoapods-graph](https://pypi.org/project/cocoapods-graph/)

Installing

~~~shell
$ [sudo] gem install cocoapods-dependencies
$ brew install graphviz
~~~

Usage

~~~shell
$ pod dependencies [PODSPEC] [--graphviz] [--image]
~~~

Use the --graphviz option to generate <podspec name>.gv or Podfile.gv containing the dependency graph in graphviz format.

Use the --image option to generate <podspec name>.png or Podfile.png containing a rendering of the dependency graph.

[!] Note that for either graphviz or image output, GraphViz must be installed and dot must be accessible via $PATH.

## 输出

html ，图片，文本。应有尽有。

## 参考

1. [cocoapods-graph](https://pypi.org/project/cocoapods-graph/)
2. [cocoapods-dependencies](<https://github.com/segiddins/cocoapods-dependencies>)


