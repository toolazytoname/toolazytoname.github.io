---
layout: post
title:  "使用Cocoapods创建私有podspec"
date:   2018-06-23 22:51:32 +0800
categories: iOS
catalog:  true
tags:
  - iOS
---



# 使用Cocoapods创建私有podspec

学习了一下如何创建私有podspec，相应的案例可以参看 我的[私有源 ](https://github.com/toolazytoname/Specs)。



## 创建并设置一个私有的Spec Repo

```shell
# pod repo add [Private Repo Name] [GitHub HTTPS clone URL]
$ pod repo add FDSpecs https://github.com/toolazytoname/Specs.git
```

## 创建Pod的所需要的项目工程文件

```shell
$ pod lib create podTestLibrary
#这里需要注意的是每当你向Pod中添加了新的文件或者以后更新了podspec的版本都需要重新执行一遍pod update命令。
```

设置tag

```shell
$ git tag -m "first release" 0.1.0
$ git push --tags     #推送tag到远端仓库

```

编辑完`podspec`文件后，需要验证一下这个文件是否可用，如果有任何`WARNING`或者`ERROR`都是不可以的，它就不能被添加到`Spec Repo`中，不过`xcode`的`WARNING`是可以存在的，验证需要执行一下命令

```shell
$ pod lib lint
```

## 创建Pod所对应的podspec文件

```she
$ pod spec create PodTestLibrary git@coding.net:wtlucky/podTestLibrary.git
```

本地测试配置好的podspec文件是否可用。

```ruby
platform :ios, '7.0'

pod 'PodTestLibrary', :path => '~/code/Cocoapods/podTest/PodTestLibrary'      # 指定路径
pod 'PodTestLibrary', :podspec => '~/code/Cocoapods/podTest/PodTestLibrary/PodTestLibrary.podspec'  # 指定podspec文件
```



## 向私有的Spec Repo中提交podspec

```shell
$ pod repo push FDSpecs PodTestLibrary.podspec  #前面是本地Repo名字 后面是podspec名字
```



## 参考

[内容比较完整成体系](<http://blog.wtlucky.com/blog/2015/02/26/create-private-podspec/>)

[写的简单，因为较新所以有些参数调过来了](https://www.jianshu.com/p/d92a987203b1)

[官方文档](https://guides.cocoapods.org)

[小坑](https://segmentfault.com/q/1010000012705430)



  

​	
